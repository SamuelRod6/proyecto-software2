import { Route } from "react-router-dom";
import InscriptionEventsScreen from "../screens/inscriptions/InscriptionEventsScreen";
import MyInscriptionsScreen from "../screens/inscriptions/MyInscriptionsScreen";
import InscriptionAdminScreen from "../screens/inscriptions/InscriptionAdminScreen";
import InscriptionReportsScreen from "../screens/inscriptions/InscriptionReportsScreen";

export const inscriptionRoutes = (
    <>
        <Route path="inscriptions" element={<InscriptionEventsScreen />} />
        <Route path="inscriptions/mine" element={<MyInscriptionsScreen />} />
        <Route path="inscriptions/admin" element={<InscriptionAdminScreen />} />
        <Route path="inscriptions/reports" element={<InscriptionReportsScreen />} />
    </>
);
