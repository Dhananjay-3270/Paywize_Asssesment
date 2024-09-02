import React, { useRef, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { addAction, undo, redo, addbrushaction } from "../redux/canvasSlice";
import styles from "./Canvas.module.css";

const Canvas = () => {
  const canvasRef = useRef(null);
  const contextRef = useRef(null);
  const [isDrawing, setDrawing] = useState(false);
  const dispatch = useDispatch();
  const actions = useSelector((state) => state.canvas.actions);
  const bactions = useSelector((state) => state.canvas.brushactions);
  const currentTool = useSelector((state) => state.tool.currentTool);
  const color = useSelector((state) => state.tool.color);
  const brushSize = useSelector((state) => state.tool.brushSize);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });

  const initCanvas = () => {
    
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    context.strokeStyle = color;
    context.lineWidth = brushSize;
    contextRef.current = context;
  };

  const handleMouseDown = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const startX = e.clientX - rect.left;
    const startY = e.clientY - rect.top;
    setStartPos({ x: startX, y: startY });
    dispatch(
      addbrushaction({ point: { x: startX, y: startY }, newStroke: true })
    );
    setDrawing(true);

    if (currentTool === "brush") {
      const context = contextRef.current;
      context.beginPath();
      context.moveTo(startX, startY);
    }
  };

  const handleMouseMove = (e) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    const context = contextRef.current;
    const rect = canvas.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;

    if (currentTool === "brush") {
      drawBrush(context, { x: currentX, y: currentY }, color, brushSize);
      dispatch(
        addbrushaction({
          point: { x: currentX, y: currentY },
          newStroke: false,
        })
      );
    } else {
      context.clearRect(0, 0, canvas.width, canvas.height);
      redrawCanvas();
      drawShape(
        context,
        startPos,
        { x: currentX, y: currentY },
        currentTool,
        color,
        brushSize
      );
    }
  };

  const drawBrush = (context, point, colour, size) => {
    context.strokeStyle = colour;
    context.lineWidth = size;
    context.lineTo(point.x, point.y);
    context.stroke();
    context.beginPath();
    context.moveTo(point.x, point.y);
  };

  const drawShape = (context, start, end, shape, colour, size) => {
    context.beginPath();
    context.strokeStyle = colour;
    context.lineWidth = size;

    if (shape === "rectangle") {
      context.rect(start.x, start.y, end.x - start.x, end.y - start.y);
    } else if (shape === "circle") {
      const radius = Math.sqrt(
        Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2)
      );
      context.arc(start.x, start.y, radius, 0, 2 * Math.PI);
    } else if (shape === "line") {
      context.moveTo(start.x, start.y);
      context.lineTo(end.x, end.y);
    }

    context.stroke();
  };

  const handleMouseUp = (e) => {
    if (!isDrawing) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const endX = e.clientX - rect.left;
    const endY = e.clientY - rect.top;
    const s = brushSize;
    const clr = color;
    if (currentTool !== "brush") {
      const newShape = {
        type: currentTool,
        start: startPos,
        end: { x: endX, y: endY },
        size: s,
        color: clr,
      };
      dispatch(addAction(newShape));
    }

    setDrawing(false);
  };

  const redrawbrush = () => {
    const context = contextRef.current;
    bactions.forEach((stroke) => {
      context.beginPath();
      stroke.forEach((point, index) => {
        if (index === 0) {
          context.moveTo(point.x, point.y);
        } else {
          context.lineTo(point.x, point.y);
        }
        context.stroke();
      });
      context.beginPath();
    });
  };

  const redrawCanvas = () => {
    const context = contextRef.current;
    context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    redrawbrush();
    actions.forEach((shape) => {
      drawShape(
        context,
        shape.start,
        shape.end,
        shape.type,
        shape.color,
        shape.size
      );
    });
  };

  useEffect(() => {
    initCanvas();
  }, [color, brushSize]);

  return (
    <canvas
      className={!isDrawing ? styles.canvas : styles.canvasdrawing}
      ref={canvasRef}
      width={750}
      height={450}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    />
  );
};

export default Canvas;
