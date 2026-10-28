import { useState } from 'react';
import Field from './Field.jsx';

export default function PwField(props) {
  const [show, setShow] = useState(false);
  return <Field {...props} type={show ? 'text' : 'password'} icon={show ? 'eyeoff' : 'eye'} onIcon={() => setShow(s => !s)} iconLabel="Mostrar contraseña" />;
}
