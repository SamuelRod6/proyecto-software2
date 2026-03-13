import { Route } from "react-router-dom";
import MensajesScreen from "../screens/mensajes/MensajesScreen";
import ConversacionScreen from "../screens/mensajes/ConversacionScreen";

export const mensajesRoutes = (
  <>
    <Route path="mensajes" element={<MensajesScreen />} />
    <Route path="mensajes/:conversacionId" element={<ConversacionScreen />} />
  </>
);
