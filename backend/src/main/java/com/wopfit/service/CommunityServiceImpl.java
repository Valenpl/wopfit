package com.wopfit.service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Base64;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.wopfit.entity.CommunityProfile;
import com.wopfit.entity.Follow;
import com.wopfit.entity.Photo;
import com.wopfit.entity.Post;
import com.wopfit.entity.PostComment;
import com.wopfit.entity.PostMark;
import com.wopfit.entity.Preferences;
import com.wopfit.entity.User;
import com.wopfit.entity.dto.CommentResponse;
import com.wopfit.entity.dto.CommunityResponse;
import com.wopfit.entity.dto.MarkResponse;
import com.wopfit.entity.dto.PersonResponse;
import com.wopfit.entity.dto.PostDetailResponse;
import com.wopfit.entity.dto.PostRequest;
import com.wopfit.entity.dto.PostResponse;
import com.wopfit.exceptions.InvalidDataException;
import com.wopfit.exceptions.NotOwnerException;
import com.wopfit.exceptions.PersonNotFoundException;
import com.wopfit.exceptions.PhotoNotFoundException;
import com.wopfit.exceptions.PostNotFoundException;
import com.wopfit.repository.CommunityProfileRepository;
import com.wopfit.repository.FollowRepository;
import com.wopfit.repository.PhotoRepository;
import com.wopfit.repository.PostCommentRepository;
import com.wopfit.repository.PostMarkRepository;
import com.wopfit.repository.PostRepository;
import com.wopfit.repository.PreferencesRepository;

@Service
public class CommunityServiceImpl implements CommunityService {
    /** Filtros de la pantalla → tipo de publicación. */
    private static final Map<String, String> FILTERS = Map.of("recetas", "receta", "act", "actividad", "preg", "pregunta");
    private static final int MAX_PHOTO = 1_500_000;
    private static final Pattern DATA_URL = Pattern.compile("^data:(image/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=\\s]+)$");

    private final CommunityProfileRepository profiles;
    private final PostRepository posts;
    private final PostCommentRepository comments;
    private final PostMarkRepository marks;
    private final FollowRepository follows;
    private final PhotoRepository photos;
    private final PreferencesRepository prefs;
    private final ProfileService profile;

    public CommunityServiceImpl(CommunityProfileRepository profiles, PostRepository posts, PostCommentRepository comments, PostMarkRepository marks,
                            FollowRepository follows, PhotoRepository photos, PreferencesRepository prefs, ProfileService profile) {
        this.profiles = profiles;
        this.posts = posts;
        this.comments = comments;
        this.marks = marks;
        this.follows = follows;
        this.photos = photos;
        this.prefs = prefs;
        this.profile = profile;
    }

    private record Candidate(CommunityProfile p, List<String> goals, List<String> shared) {}

    /** "Lucía Fernández" → "Lucía F.": en la comunidad se ve el nombre y la inicial del apellido. */
    public static String displayName(String full) {
        if (full == null || full.isBlank()) return "Vos";
        String[] p = full.trim().split("\\s+");
        return p.length == 1 ? p[0] : p[0] + " " + Character.toUpperCase(p[p.length - 1].charAt(0)) + ".";
    }

    private static List<String> list(String csv) {
        return csv == null || csv.isBlank() ? List.of() : Arrays.stream(csv.split(",")).map(String::trim).filter(s -> !s.isEmpty()).toList();
    }

    /** El perfil de la persona en la comunidad: se crea la primera vez y se mantiene al día con su nombre y objetivos. */
    private CommunityProfile me(Long userId) {
        User u = profile.user(userId);
        Preferences p = prefs.findByUserId(userId).orElse(null);
        CommunityProfile c = profiles.findByUserId(userId).orElseGet(() -> {
            CommunityProfile n = new CommunityProfile();
            n.setUser(u);
            return n;
        });
        String name = displayName(u.getName());
        String goals = p == null ? c.getGoals() : String.join(",", Catalog.GOALS.keySet().stream().filter(p.getGoals()::contains).toList());
        int days = p == null ? c.getDaysPerWeek() : p.getDays().size();
        if (c.getId() != null && name.equals(c.getName()) && Objects.equals(goals, c.getGoals()) && days == c.getDaysPerWeek()) return c;
        c.setName(name);
        c.setGoals(goals);
        c.setDaysPerWeek(days);
        return profiles.save(c);
    }

    private String myGoal(CommunityProfile me) {
        List<String> g = list(me.getGoals());
        return g.isEmpty() ? "mover" : g.get(0);
    }

    /** Me gusta, guardados y comentarios ya contados, para armar muchas publicaciones sin consultar por cada una. */
    private record Stats(Set<Long> liked, Set<Long> saved, Map<Long, Long> likes, Map<Long, Long> comments) {}

    private static Map<Long, Long> counts(List<Object[]> rows) {
        Map<Long, Long> m = new HashMap<>();
        rows.forEach(r -> m.put((Long) r[0], (Long) r[1]));
        return m;
    }

    private static Set<Long> postIds(List<PostMark> list) {
        Set<Long> s = new HashSet<>();
        list.forEach(m -> s.add(m.getPost().getId()));
        return s;
    }

    /** Para el feed: 4 consultas en total, sin importar cuántas publicaciones haya. */
    private Stats stats(CommunityProfile me) {
        return new Stats(postIds(marks.findByProfileIdAndKind(me.getId(), "like")), postIds(marks.findByProfileIdAndKind(me.getId(), "save")),
                counts(marks.countLikesByPost()), counts(comments.countByPost()));
    }

    /** Para una sola publicación. */
    private Stats stats(CommunityProfile me, Long postId) {
        Set<Long> one = Set.of(postId);
        return new Stats(marks.findByPostIdAndProfileIdAndKind(postId, me.getId(), "like").isPresent() ? one : Set.of(),
                marks.findByPostIdAndProfileIdAndKind(postId, me.getId(), "save").isPresent() ? one : Set.of(),
                Map.of(postId, marks.countByPostIdAndKind(postId, "like")), Map.of(postId, comments.countByPostId(postId)));
    }

    private PostResponse dto(Post p, CommunityProfile me, Stats s) {
        CommunityProfile a = p.getAuthor();
        Long id = p.getId();
        return new PostResponse(id, a.getId(), a.getName(), a.getId().equals(me.getId()), p.getGoal(), Catalog.GOALS.get(p.getGoal()), p.getType(),
                p.getTitle(), p.getBody(), p.getEmoji(), p.getBg(), list(p.getTags()), p.getPhotoId() == null ? null : "/api/v1/photos/" + p.getPhotoId(),
                p.getBaseLikes() + s.likes().getOrDefault(id, 0L).intValue(), s.liked().contains(id), s.saved().contains(id),
                s.comments().getOrDefault(id, 0L).intValue(), p.getCreatedAt());
    }

    private PostResponse dto(Post p, CommunityProfile me) {
        return dto(p, me, stats(me, p.getId()));
    }

    private Post post(Long id) {
        return posts.findById(id).orElseThrow(() -> new PostNotFoundException());
    }

    @Transactional
    @Override
    public CommunityResponse community(Long userId, String filter) {
        CommunityProfile me = me(userId);
        Set<String> mine = new HashSet<>(list(me.getGoals()));
        Set<Long> following = new HashSet<>();
        follows.findByFollowerId(me.getId()).forEach(f -> following.add(f.getFollowed().getId()));

        // Personas como vos: las 5 que más objetivos comparten con vos.
        List<PersonResponse> people = profiles.findAll().stream().filter(c -> !c.getId().equals(me.getId()))
                .map(c -> new Candidate(c, list(c.getGoals()), list(c.getGoals()).stream().filter(mine::contains).toList()))
                .sorted(Comparator.comparingInt((Candidate c) -> -c.shared().size()).thenComparing(c -> c.p().getId()))
                .limit(5)
                .map(c -> new PersonResponse(c.p().getId(), c.p().getName(), c.goals(), c.shared().isEmpty() ? null : c.shared().get(0),
                        c.p().getDaysPerWeek(), following.contains(c.p().getId())))
                .toList();

        List<Post> all = posts.findAllByOrderByCreatedAtDesc();
        List<Post> shown;
        String type = FILTERS.get(filter);
        if (type != null) {
            shown = all.stream().filter(p -> p.getType().equals(type)).toList();
        } else {
            // "Para vos": lo tuyo, lo de quienes seguís y lo de tus objetivos primero; después el resto.
            List<Post> first = new ArrayList<>(), rest = new ArrayList<>();
            for (Post p : all) {
                boolean near = p.getAuthor().getId().equals(me.getId()) || following.contains(p.getAuthor().getId()) || mine.contains(p.getGoal());
                (near ? first : rest).add(p);
            }
            first.addAll(rest);
            shown = first;
        }
        String g = myGoal(me);
        Stats s = stats(me);
        return new CommunityResponse(me.getId(), g, Catalog.GOALS.get(g), people, shown.stream().map(p -> dto(p, me, s)).toList());
    }

    @Transactional
    @Override
    public PostDetailResponse detail(Long userId, Long postId) {
        CommunityProfile me = me(userId);
        Post p = post(postId);
        List<CommentResponse> list = comments.findByPostIdOrderByCreatedAtAsc(postId).stream()
                .map(c -> new CommentResponse(c.getId(), c.getAuthor().getName(), c.getAuthor().getId().equals(me.getId()), c.getText(), c.getCreatedAt())).toList();
        return new PostDetailResponse(dto(p, me), list);
    }

    /** Decodifica la foto (data URL) y revisa que sea una imagen de verdad y no muy pesada. */
    private Photo photo(CommunityProfile owner, String dataUrl) {
        Matcher m = DATA_URL.matcher(dataUrl.trim());
        if (!m.matches()) throw new InvalidDataException("La foto tiene que ser JPG, PNG o WebP");
        byte[] bytes;
        try {
            bytes = Base64.getMimeDecoder().decode(m.group(2));
        } catch (IllegalArgumentException e) {
            throw new InvalidDataException("No pudimos leer la foto");
        }
        if (bytes.length > MAX_PHOTO) throw new InvalidDataException("La foto es muy pesada. Probá con otra.");
        if (!looksLike(m.group(1), bytes)) throw new InvalidDataException("No pudimos leer la foto");
        Photo ph = new Photo();
        ph.setId(UUID.randomUUID().toString());
        ph.setOwner(owner);
        ph.setContentType(m.group(1));
        ph.setData(bytes);
        ph.setCreatedAt(Instant.now());
        return photos.save(ph);
    }

    static boolean looksLike(String type, byte[] b) {
        if (b.length < 12) return false;
        return switch (type) {
            case "image/jpeg" -> (b[0] & 0xFF) == 0xFF && (b[1] & 0xFF) == 0xD8;
            case "image/png" -> (b[0] & 0xFF) == 0x89 && b[1] == 'P' && b[2] == 'N' && b[3] == 'G';
            default -> b[0] == 'R' && b[1] == 'I' && b[2] == 'F' && b[3] == 'F' && b[8] == 'W' && b[9] == 'E' && b[10] == 'B' && b[11] == 'P';
        };
    }

    @Transactional
    @Override
    public PostResponse create(Long userId, PostRequest r) {
        if (!TYPES.contains(r.type())) throw new InvalidDataException("Elegí receta, actividad o pregunta");
        String title = r.title() == null ? "" : r.title().trim();
        String body = r.body() == null ? "" : r.body().trim();
        if (title.isEmpty() && body.isEmpty()) throw new InvalidDataException("Escribí un título o un texto para poder publicar");
        if (title.isEmpty()) { // como en la v6: sin título, el texto pasa a ser el título
            title = body.length() > 60 ? body.substring(0, 57).trim() + "…" : body;
            body = body.length() > 60 ? body : "";
        }
        CommunityProfile me = me(userId);
        Post p = new Post();
        p.setAuthor(me);
        p.setGoal(myGoal(me));
        p.setType(r.type());
        p.setTitle(title);
        p.setBody(body.isEmpty() ? null : body);
        if (r.photo() != null && !r.photo().isBlank()) p.setPhotoId(photo(me, r.photo()).getId());
        p.setCreatedAt(Instant.now());
        return dto(posts.save(p), me);
    }

    @Transactional
    @Override
    public void delete(Long userId, Long postId) {
        CommunityProfile me = me(userId);
        Post p = post(postId);
        if (!p.getAuthor().getId().equals(me.getId())) throw new NotOwnerException();
        comments.deleteByPostId(postId);
        marks.deleteByPostId(postId);
        if (p.getPhotoId() != null) photos.deleteById(p.getPhotoId());
        posts.delete(p);
    }

    @Transactional
    @Override
    public CommentResponse comment(Long userId, Long postId, String text) {
        CommunityProfile me = me(userId);
        PostComment c = new PostComment();
        c.setPost(post(postId));
        c.setAuthor(me);
        c.setText(text.trim());
        c.setCreatedAt(Instant.now());
        comments.save(c);
        return new CommentResponse(c.getId(), me.getName(), true, c.getText(), c.getCreatedAt());
    }

    /** Me gusta ("like") o guardar ("save"). */
    @Transactional
    @Override
    public MarkResponse mark(Long userId, Long postId, String kind, boolean on) {
        CommunityProfile me = me(userId);
        Post p = post(postId);
        var current = marks.findByPostIdAndProfileIdAndKind(postId, me.getId(), kind);
        if (on && current.isEmpty()) {
            PostMark m = new PostMark();
            m.setPost(p);
            m.setProfile(me);
            m.setKind(kind);
            marks.save(m);
        } else if (!on) {
            current.ifPresent(marks::delete);
        }
        return new MarkResponse(on, p.getBaseLikes() + (int) marks.countByPostIdAndKind(postId, "like"));
    }

    @Transactional
    @Override
    public boolean follow(Long userId, Long personId, boolean on) {
        CommunityProfile me = me(userId);
        if (me.getId().equals(personId)) throw new InvalidDataException("No podés seguirte a vos");
        CommunityProfile other = profiles.findById(personId).orElseThrow(() -> new PersonNotFoundException());
        var current = follows.findByFollowerIdAndFollowedId(me.getId(), personId);
        if (on && current.isEmpty()) {
            Follow f = new Follow();
            f.setFollower(me);
            f.setFollowed(other);
            follows.save(f);
        } else if (!on) {
            current.ifPresent(follows::delete);
        }
        return on;
    }

    @Transactional(readOnly = true)
    @Override
    public Photo photo(String id) {
        return photos.findById(id).orElseThrow(() -> new PhotoNotFoundException());
    }
}
