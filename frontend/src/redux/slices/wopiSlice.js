import { createSlice } from '@reduxjs/toolkit';
import { http } from '../../api/axios';
import { addSingleCases, apiThunk, emptyEntry, fulfilledOf, markStale, wait } from '../helpers';

// Chat con Wopi. La pregunta aparece al instante y la respuesta tarda al menos 600 ms ("Wopi está escribiendo").
export const fetchChat = apiThunk('wopi/fetch', () => http.get('/wopi/messages'), { cached: s => s.wopi.chat });
export const askWopi = apiThunk('wopi/ask', async text => {
  const [r] = await Promise.all([http.post('/wopi/messages', { text }), wait(600)]);
  return r;
}, { condition: (_, { getState }) => !getState().wopi.typing });

const initialState = { chat: emptyEntry, typing: false };
const TMP = 'tmp';
const dropTmp = s => { if (s.chat.data) s.chat.data.messages = s.chat.data.messages.filter(m => m.id !== TMP); };

const wopiSlice = createSlice({
  name: 'wopi',
  initialState,
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase('auth/logout', () => initialState)
      .addCase(askWopi.pending, (s, a) => {
        s.typing = true;
        if (s.chat.data) s.chat.data.messages.push({ id: TMP, role: 'user', text: a.meta.arg, cards: [], actions: [] });
      })
      .addCase(askWopi.fulfilled, (s, a) => {
        s.typing = false;
        dropTmp(s);
        if (s.chat.data) {
          s.chat.data.messages.push(a.payload.question, a.payload.reply);
          s.chat.data.left = a.payload.left;
        }
      })
      .addCase(askWopi.rejected, s => { s.typing = false; dropTmp(s); });
    addSingleCases(builder, fetchChat, 'chat');
    builder.addMatcher(fulfilledOf('auth/activatePremium', 'auth/cancelPremium'), s => markStale(s.chat));
  }
});

export default wopiSlice.reducer;
