import { Route } from "react-router-dom";
// screens
import EventsListScreen from "../screens/events/EventsListScreen";

export const eventRoutes = (
	<>
		<Route path="events" element={<EventsListScreen />} />
	</>
);
