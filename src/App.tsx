import { Layer, Rect, Stage } from "react-konva";
import { KonvaEventObject } from "konva/lib/Node";
import ToolBar from "./components/ToolBar";
import { useEffect, useMemo, useState } from "react";
import { Shape, Tool } from "./types";
import { useDragging } from "./hooks/useDragging";
import Shapes from "./components/Shapes";
import { useMouseArea } from "./hooks/useMouseArea";
import {
  SelectionBox,
  isShapeInSelection,
} from "./helpers/selection/isShapeInSelection";
import ShapeOptions from "./components/ShapeOptions";
import { useTool } from "./hooks/useTool";

export interface ShapeStyle {
  fill: string;
  stroke: string;
  strokeWidth: number;
  fontSize: number;
  cornerRadius: number;
  text?: string;
}

function App() {
  const { tool, setTool } = useTool();
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [defaultStyle, setDefaultStyle] = useState<ShapeStyle>({
    fill: "transparent",
    stroke: "white",
    strokeWidth: 3,
    fontSize: 20,
    cornerRadius: 10,
  });

  const [width, setWidth] = useState(0);
  const [height, setheight] = useState(0);

  useEffect(() => {
    setWidth(window.innerWidth);
    setheight(window.innerHeight);

    const handleResize = () => {
      setWidth(window.innerWidth);
      setheight(window.innerHeight);
    };
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const { stageScale, stagePos, ...draggingProps } = useDragging();

  const selectShapesInArea = (selectionBox: SelectionBox) =>
    setShapes((prev) =>
      prev.map((shape) => ({
        ...shape,
        selected: isShapeInSelection(shape, selectionBox),
      }))
    );

  const onSelectShape = (shapeId: string) =>
    setShapes((prev) =>
      prev.map((shape) => ({ ...shape, selected: shape.id === shapeId }))
    );

  const unselectShapes = () =>
    setShapes((prev) => prev.map((shape) => ({ ...shape, selected: false })));

  const handleAppendShape = (shape: Shape) =>
    setShapes((prev) => [
      ...prev.map((x) => ({ ...x, selected: false })),
      { ...shape, selected: true, strokeWidth: defaultStyle.strokeWidth },
    ]);

  const { selectedArea, previewLayerRef, ...selectHandlers } = useMouseArea({
    tool,
    style: defaultStyle,
    onAppendShape: handleAppendShape,
    selectShapesInArea,
    selectShape: onSelectShape,
    unselectShapes,
  });

  useEffect(unselectShapes, [tool]);

  const handleDragShape = (e: KonvaEventObject<MouseEvent>) => {
    if (!("id" in e.target.attrs)) return;

    const shapeId = e.target.attrs?.id as string;

    setShapes((prev) =>
      prev.map((shape) =>
        shape.id === shapeId
          ? { ...shape, x: e.target.x(), y: e.target.y() }
          : shape
      )
    );
  };

  const activeShapes = useMemo(
    () => shapes.filter((shape) => shape.selected),
    [shapes]
  );

  return (
    <main className="w-full relative">
      <ToolBar activeTool={tool} onChange={(tool: Tool) => setTool(tool)} />
      <ShapeOptions
        style={defaultStyle}
        deleteShapes={() =>
          setShapes((prev) => prev.filter((shape) => !shape.selected))
        }
        onApplyStyles={(style) => {
          setDefaultStyle((prev) => ({ ...prev, ...style }));
          setShapes((prev) =>
            prev.map((shape) =>
              shape.selected ? { ...shape, ...style } : shape
            )
          );
        }}
        activeShapes={activeShapes}
      />
      <Stage
        draggable={tool === Tool.GRAB}
        {...draggingProps}
        {...stagePos}
        {...selectHandlers}
        scale={{ x: stageScale, y: stageScale }}
        style={{ cursor: tool === Tool.GRAB ? "grab" : "default" }}
        className="bg-zinc-900"
        width={width}
        height={height}
      >
        <Layer>
          <Shapes tool={tool} shapes={shapes} onDragEnd={handleDragShape} />
        </Layer>
        <Layer>
          <Rect
            {...selectedArea}
            opacity={0.3}
            fill="transparent"
            stroke="#818cf8"
            strokeWidth={2}
          />
        </Layer>
        <Layer ref={previewLayerRef}>{/* Create shape preview layer */}</Layer>
      </Stage>
    </main>
  );
}

export default App;
