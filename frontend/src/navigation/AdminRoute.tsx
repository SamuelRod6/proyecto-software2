import ResourceRoute from "./ResourceRoute";

export default function AdminRoute({
  resourceKey,
  children,
}: {
  resourceKey: string;
  children: JSX.Element;
}): JSX.Element {
  return <ResourceRoute resourceKey={resourceKey}>{children}</ResourceRoute>;
}
