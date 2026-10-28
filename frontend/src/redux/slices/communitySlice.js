import { createSlice } from '@reduxjs/toolkit';
import { http } from '../../api/axios';
import { addEntryCases, addSingleCases, apiThunk, emptyEntry, getEntry } from '../helpers';

// Comunidad: personas como vos, el feed por filtro ('para', 'recetas', 'act', 'preg') de a páginas y cada publicación con sus comentarios.
const PAGE = 10;
/** El feed se guarda como { posts, page, last }: las páginas que llegan se van sumando a `posts`. */
const toFeed = r => ({ posts: r.content, page: r.page, last: r.last });
export const fetchPeople = apiThunk('community/fetchPeople', () => http.get('/people'), { cached: s => s.community.people });
export const fetchFeed = apiThunk('community/fetchFeed', f => http.get(`/posts?filter=${f}&page=0&size=${PAGE}`).then(toFeed),
  { cached: (s, f) => getEntry(s.community.feeds, f) });
/** La página siguiente del feed `f`. No sale si ya se está pidiendo o si no hay más. */
export const fetchMorePosts = apiThunk('community/fetchMore', (f, getState) => {
  const { page } = getState().community.feeds[f].data;
  return http.get(`/posts?filter=${f}&page=${page + 1}&size=${PAGE}`).then(toFeed);
}, { condition: (f, { getState }) => { const e = getEntry(getState().community.feeds, f); return !!e.data && !e.data.last && !e.loadingMore; } });
export const fetchPost = apiThunk('community/fetchPost', id => http.get(`/posts/${id}`), { cached: (s, id) => getEntry(s.community.posts, String(id)) });
export const createPost = apiThunk('community/create', body => http.post('/posts', body), { toast: '¡Publicado en la comunidad!' });
export const deletePost = apiThunk('community/delete', id => http.del(`/posts/${id}`), { toast: 'Publicación borrada' });
export const commentPost = apiThunk('community/comment', ({ id, text }) => http.post(`/posts/${id}/comments`, { text }));
/** kind: 'like' o 'save'. */
export const markPost = apiThunk('community/mark', ({ id, kind, on }) => http.put(`/posts/${id}/${kind}`, { on }),
  { toast: (_, a) => (a.kind === 'save' ? (a.on ? 'Guardado' : 'Quitado de guardados') : null) });
export const followPerson = apiThunk('community/follow', ({ id, on }) => http.put(`/people/${id}/follow`, { on }));

const initialState = { people: emptyEntry, feeds: {}, posts: {} };
/** En qué feed, además de "Para vos", aparece cada tipo de publicación. */
const FEED_OF = { receta: 'recetas', actividad: 'act', pregunta: 'preg' };

/** Aplica un cambio a la publicación en todos los lugares donde está (feeds y detalle). */
function eachPost(s, id, fn) {
  Object.values(s.feeds).forEach(e => { if (e.data) e.data.posts = e.data.posts.map(p => (p.id === id ? fn(p) : p)); });
  const d = s.posts[String(id)];
  if (d && d.data) d.data.post = fn(d.data.post);
}
const setMark = (p, kind, on, likes) => (kind === 'like'
  ? { ...p, liked: on, likes: likes !== undefined ? likes : p.likes + (on ? 1 : -1) }
  : { ...p, saved: on });
const setFollow = (s, id, on) => {
  if (s.people.data) s.people.data.people = s.people.data.people.map(x => (x.id === id ? { ...x, following: on } : x));
};

const communitySlice = createSlice({
  name: 'community',
  initialState,
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase('auth/logout', () => initialState)
      // Me gusta, guardar y seguir se ven al instante; si falla, vuelven como estaban.
      .addCase(markPost.pending, (s, a) => { const { id, kind, on } = a.meta.arg; eachPost(s, id, p => setMark(p, kind, on)); })
      .addCase(markPost.fulfilled, (s, a) => { const { id, kind, on } = a.meta.arg; if (kind === 'like') eachPost(s, id, p => ({ ...p, likes: a.payload.likes })); else eachPost(s, id, p => setMark(p, kind, on)); })
      .addCase(markPost.rejected, (s, a) => { const { id, kind, on } = a.meta.arg; eachPost(s, id, p => setMark(p, kind, !on)); })
      .addCase(followPerson.pending, (s, a) => setFollow(s, a.meta.arg.id, a.meta.arg.on))
      .addCase(followPerson.rejected, (s, a) => setFollow(s, a.meta.arg.id, !a.meta.arg.on))
      // Lo que publicás aparece primero en "Para vos" y en el feed de su tipo.
      .addCase(createPost.fulfilled, (s, a) => {
        for (const f of ['para', FEED_OF[a.payload.type]]) {
          const e = s.feeds[f];
          if (e && e.data) e.data.posts.unshift(a.payload);
        }
      })
      .addCase(deletePost.fulfilled, (s, a) => {
        const id = a.meta.arg;
        // El detalle no se borra: la pantalla de la publicación todavía está abierta y, sin datos, la volvería a pedir (404).
        Object.values(s.feeds).forEach(e => { if (e.data) e.data.posts = e.data.posts.filter(p => p.id !== id); });
      })
      .addCase(commentPost.fulfilled, (s, a) => {
        const { id } = a.meta.arg;
        eachPost(s, id, p => ({ ...p, comments: p.comments + 1 }));
        const d = s.posts[String(id)];
        if (d && d.data) d.data.comments.push(a.payload);
      })
      .addCase(fetchMorePosts.pending, (s, a) => { s.feeds[a.meta.arg].loadingMore = true; })
      .addCase(fetchMorePosts.rejected, (s, a) => { s.feeds[a.meta.arg].loadingMore = false; })
      .addCase(fetchMorePosts.fulfilled, (s, a) => {
        const e = s.feeds[a.meta.arg];
        e.loadingMore = false;
        // Si se publicó o se borró algo, las páginas se corren: no se suma lo que ya está.
        const seen = new Set(e.data.posts.map(p => p.id));
        e.data.posts.push(...a.payload.posts.filter(p => !seen.has(p.id)));
        e.data.page = a.payload.page;
        e.data.last = a.payload.last;
      });
    addSingleCases(builder, fetchPeople, 'people');
    addEntryCases(builder, fetchFeed, 'feeds');
    addEntryCases(builder, fetchPost, 'posts', id => String(id));
  }
});

export default communitySlice.reducer;
