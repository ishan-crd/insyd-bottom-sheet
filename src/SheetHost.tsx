import React, {
  createContext,
  useContext,
  useEffect,
  useId,
  useMemo,
  useState,
} from "react";

/**
 * In-app portal for SmoothSheet. Sheets render their content HERE (a single
 * layer near the app root, in the app's own window) instead of inside a native
 * <Modal>. That's the whole reason the keyboard behaves correctly on Android
 * edge-to-edge builds: a native Modal is a separate window whose keyboard
 * insets React Native can't observe, so the sheet never rose. Rendered in the
 * main window, ordinary keyboard handling just works.
 *
 * Mount <SheetHost> once, high in the tree but BELOW every provider your sheet
 * content needs (theme, safe-area, query client, etc.) and inside your
 * GestureHandlerRootView — portaled content resolves context from where the
 * host sits, not from where the sheet element was created.
 */

type Registry = {
  set: (id: string, node: React.ReactNode) => void;
  remove: (id: string) => void;
};

const SheetPortalContext = createContext<Registry | null>(
  null,
);

export function SheetHost({
  children,
}: {
  children: React.ReactNode;
}) {
  const [nodes, setNodes] = useState<
    Record<string, React.ReactNode>
  >({});

  const registry = useMemo<Registry>(
    () => ({
      set: (id, node) =>
        setNodes((prev) => ({ ...prev, [id]: node })),
      remove: (id) =>
        setNodes((prev) => {
          if (!(id in prev)) return prev;
          const next = { ...prev };
          delete next[id];
          return next;
        }),
    }),
    [],
  );

  return (
    <SheetPortalContext.Provider value={registry}>
      {children}
      {Object.entries(nodes).map(([id, node]) => (
        <React.Fragment key={id}>{node}</React.Fragment>
      ))}
    </SheetPortalContext.Provider>
  );
}

let warnedNoHost = false;

/**
 * Teleports its children into the nearest <SheetHost>. Updates on every render
 * so live content stays fresh; unmounts its slot on cleanup. Falls back to
 * rendering inline (with a one-time dev warning) if no host is mounted, so a
 * missing provider degrades instead of crashing.
 */
export function SheetPortal({
  children,
}: {
  children: React.ReactNode;
}) {
  const registry = useContext(SheetPortalContext);
  const id = useId();

  useEffect(() => {
    if (!registry) return;
    registry.set(id, children);
    return () => registry.remove(id);
  });

  if (!registry) {
    if (__DEV__ && !warnedNoHost) {
      warnedNoHost = true;
      console.warn(
        "[insyd-bottom-sheet] No <SheetHost> found — rendering the sheet inline. " +
          "Wrap your app in <SheetHost> (inside GestureHandlerRootView, below your providers) " +
          "for correct overlaying and keyboard behavior.",
      );
    }
    return <>{children}</>;
  }
  return null;
}
