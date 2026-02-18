import { Route } from "react-router-dom";
// screens
import EventCatalogScreen from "../screens/eventCatalog/EventCatalogScreen";

export const eventCatalogRoutes = (
      <>
            <Route path="event-catalog" element={<EventCatalogScreen />} />
      </>
);