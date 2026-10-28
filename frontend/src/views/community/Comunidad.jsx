import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchFeed, fetchMorePosts, fetchPeople, followPerson, markPost } from '../../redux/slices/communitySlice';
import { getEntry } from '../../redux/helpers';
import useFetch from '../../hooks/useFetch';
import useTab from '../../hooks/useTab';
import { goal } from '../../utils/constants';
import PostCard from '../../components/community/PostCard.jsx';
import Avatar from '../../components/pros/Avatar.jsx';
import Btn from '../../components/shared/Btn.jsx';
import ErrorBox from '../../components/shared/ErrorBox.jsx';
import Icon from '../../components/shared/Icon.jsx';
import ScrollArea from '../../components/shared/ScrollArea.jsx';
import Sect from '../../components/shared/Sect.jsx';

const FILTERS = [['para', 'Para vos'], ['recetas', 'Recetas'], ['act', 'Activid.'], ['preg', 'Dudas']];
const KEYS = FILTERS.map(([k]) => k);

export default function Comunidad() {
  const nav = useNavigate();
  const dispatch = useDispatch();
  const [f, pick] = useTab('comunidad', KEYS, 'para');
  const people = useFetch(fetchPeople, undefined, s => s.community.people);
  const { data, error, retry } = useFetch(fetchFeed, f, s => getEntry(s.community.feeds, f));
  const loadingMore = useSelector(s => getEntry(s.community.feeds, f).loadingMore);
  return <div className="screen"><ScrollArea style={{ paddingBottom: 90 }}>
    <h1 style={{ marginTop: 4 }}>Comunidad</h1><p className="sub">Gente como vos, con tus mismos objetivos.</p>
    {people.data && <>
      <Sect title="Personas como vos" />
      <div className="hscroll">{people.data.people.map(p => <div key={p.id} className="person"><Avatar n={p.name} />
        <b style={{ color: 'var(--navy)', fontSize: 14 }}>{p.name}</b>
        <span className="tiny muted" style={{ lineHeight: 1.3 }}>{p.sharedGoal ? 'También quiere ' + goal(p.sharedGoal).t.toLowerCase() : goal(p.goals[0] || 'mover').t} · Entrena {p.daysPerWeek} días</span>
        <button className={`btn sm ${p.following ? 'outline' : ''}`} style={{ minHeight: 32, padding: '0 12px', fontSize: 13 }} onClick={() => dispatch(followPerson({ id: p.id, on: !p.following }))} aria-pressed={p.following}>{p.following ? 'Siguiendo' : 'Seguir'}</button>
      </div>)}</div>
    </>}
    <div className="seg four" style={{ marginTop: 16 }}>{FILTERS.map(([k, t]) => <button key={k} className={f === k ? 'on' : ''} onClick={() => pick(k)}>{t}</button>)}</div>
    {error && !data && <ErrorBox error={error} onRetry={retry} />}
    {!data && !error && <p className="center muted">Cargando…</p>}
    {data && (data.posts.length ? data.posts.map(p => <PostCard key={p.id} p={p} short onOpen={() => nav(`/comunidad/${p.id}`)}
      onMark={(kind, on) => dispatch(markPost({ id: p.id, kind, on }))} />) : <div className="card center muted">Todavía no hay publicaciones acá.</div>)}
    {data && !data.last && <div className="center mt12"><Btn className="ghost sm" busy={loadingMore} onClick={() => dispatch(fetchMorePosts(f))}>Ver más</Btn></div>}
  </ScrollArea><button className="fabbtn" onClick={() => nav('/comunidad/compartir')}><Icon n="plus" /> Compartir</button></div>;
}
