import { Route } from "react-router-dom";
// screens
import EventsListScreen from "../screens/events/EventsListScreen";
import EventDetailScreen from "../screens/events/EventDetailScreen";

export const eventRoutes = (
	<>
		<Route path="events" element={<EventsListScreen />} />
		<Route path="events/:eventId" element={<EventDetailScreen />} />
	</>
);
