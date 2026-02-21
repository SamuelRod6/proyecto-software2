import { Route } from "react-router-dom";
// screens
import EventsScreenRouter from "../screens/events/EventsScreenRouter";

export const eventRoutes = (
	<>
		<Route path="events" element={<EventsScreenRouter />} />
	</>
);
