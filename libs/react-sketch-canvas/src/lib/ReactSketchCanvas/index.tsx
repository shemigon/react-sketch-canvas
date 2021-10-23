import { produce } from 'immer';
import * as React from 'react';
import { Canvas } from '../Canvas';
import { CanvasPath, CanvasLabel, ExportImageType, Point } from '../types';

/* Default settings */

const defaultProps = {
  width: '100%',
  height: '100%',
  className: '',
  canvasColor: 'white',
  strokeColor: 'red',
  backgroundImage: '',
  exportWithBackgroundImage: true,
  preserveBackgroundImageAspectRatio: 'none',
  strokeWidth: 4,
  eraserWidth: 8,
  textSize: '1em',
  allowOnlyPointerType: 'all',
  style: {
    border: '0.0625rem solid #9c9c9c',
    borderRadius: '0.25rem',
  },
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  onUpdate: (_: CanvasPath[]): void => {},
  withTimestamp: false,
};

/* Props validation */

export type ReactSketchCanvasProps = {
  width: string;
  height: string;
  className: string;
  strokeColor: string;
  canvasColor: string;
  backgroundImage: string;
  exportWithBackgroundImage: boolean;
  preserveBackgroundImageAspectRatio: string;
  strokeWidth: number;
  eraserWidth: number;
  textSize: string;
  allowOnlyPointerType: string;
  onUpdate: (updatedPaths: CanvasPath[], updatedTexts: CanvasLabel[]) => void;
  style: React.CSSProperties;
  withTimestamp: boolean;
};

export enum ReactSketchCanvasMode {
  none,
  pen,
  text,
  eraser,
}

export type ReactSketchCanvasStates = {
  drawMode: ReactSketchCanvasMode;
  isDrawing: boolean;
  resetStack: CanvasPath[];
  undoStack: CanvasPath[];
  currentPaths: CanvasPath[];
  currentTexts: CanvasLabel[];
};

export class ReactSketchCanvas extends React.Component<
  ReactSketchCanvasProps,
  ReactSketchCanvasStates
> {
  static defaultProps = defaultProps;

  svgCanvas: React.RefObject<Canvas>;

  initialState = {
    drawMode: ReactSketchCanvasMode.none,
    isDrawing: false,
    // eslint-disable-next-line react/no-unused-state
    resetStack: [],
    undoStack: [],
    currentPaths: [],
    currentTexts: [],
  };

  constructor(props: ReactSketchCanvasProps) {
    super(props);

    this.state = this.initialState;

    this.handlePointerDown = this.handlePointerDown.bind(this);
    this.handlePointerMove = this.handlePointerMove.bind(this);
    this.handlePointerUp = this.handlePointerUp.bind(this);

    this.exportImage = this.exportImage.bind(this);
    this.exportSvg = this.exportSvg.bind(this);
    this.exportPaths = this.exportPaths.bind(this);
    this.loadPaths = this.loadPaths.bind(this);

    this.setMode = this.setMode.bind(this);
    this.clearCanvas = this.clearCanvas.bind(this);
    this.undo = this.undo.bind(this);
    this.redo = this.redo.bind(this);
    this.resetCanvas = this.resetCanvas.bind(this);
    this.getSketchingTime = this.getSketchingTime.bind(this);
    this.isDrawingMode = this.isDrawingMode.bind(this);

    this.liftUpdatedStateUp = this.liftUpdatedStateUp.bind(this);

    this.svgCanvas = React.createRef();
  }

  isDrawingMode(): boolean {
    const mode = this.state.drawMode;
    return mode === ReactSketchCanvasMode.pen || mode === ReactSketchCanvasMode.eraser;
  }

  getSketchingTime(): Promise<number> {
    const { withTimestamp } = this.props;
    const { currentPaths } = this.state;

    return new Promise<number>((resolve, reject) => {
      if (!withTimestamp) {
        reject(new Error("Set 'withTimestamp' prop to get sketching time"));
      }

      try {
        const sketchingTime = currentPaths.reduce(
          (totalSketchingTime, path) => {
            const startTimestamp = path.startTimestamp ?? 0;
            const endTimestamp = path.endTimestamp ?? 0;

            return totalSketchingTime + (endTimestamp - startTimestamp);
          },
          0
        );

        resolve(sketchingTime);
      } catch (e) {
        reject(e);
      }
    });
  }

  resetCanvas(): void {
    this.setState(this.initialState);
  }

  liftUpdatedStateUp(): void {
    const { currentPaths, currentTexts } = this.state;
    const { onUpdate } = this.props;

    onUpdate(currentPaths, currentTexts);
  }

  /* Mouse Handlers - Mouse down, move and up */

  handlePointerDown(point: Point): void {
    if(!this.isDrawingMode()) {
      if (this.state.drawMode === ReactSketchCanvasMode.none) {
        return;
      }
      // handle text label insertion
      this.setState(
        produce((draft: ReactSketchCanvasStates) => {
          draft.isDrawing = false;
          draft.undoStack = [];

          const textLabel: CanvasLabel = {
            text: "Text",
            position: point,
            size: '1em',
          }

          draft.currentTexts.push(textLabel);
        })
      )
      return
    }

    const { strokeColor, strokeWidth, eraserWidth, withTimestamp } = this.props;
    this.setState(
      produce((draft: ReactSketchCanvasStates) => {
        draft.isDrawing = true;
        draft.undoStack = [];

        let stroke: CanvasPath = {
          drawMode: draft.drawMode,
          strokeColor: draft.drawMode ? strokeColor : '#000000', // Eraser using mask
          strokeWidth: draft.drawMode ? strokeWidth : eraserWidth,
          paths: [point],
        };

        if (withTimestamp) {
          stroke = {
            ...stroke,
            startTimestamp: Date.now(),
            endTimestamp: 0,
          };
        }

        draft.currentPaths.push(stroke);
      }),
      this.liftUpdatedStateUp
    );
  }

  handlePointerMove(point: Point): void {
    const { isDrawing } = this.state;

    if (!isDrawing) return;

    this.setState(
      produce((draft: ReactSketchCanvasStates) => {
        const currentStroke = draft.currentPaths[draft.currentPaths.length - 1];
        currentStroke.paths.push(point);
      }),
      this.liftUpdatedStateUp
    );
  }

  handlePointerUp(): void {
    const { withTimestamp } = this.props;

    const { isDrawing } = this.state;

    if (!isDrawing) {
      return;
    }

    this.setState(
      produce((draft: ReactSketchCanvasStates) => {
        draft.isDrawing = false;

        if (!withTimestamp) {
          return;
        }

        let currentStroke: CanvasPath | undefined = draft.currentPaths.pop();

        if (currentStroke) {
          currentStroke = {
            ...currentStroke,
            endTimestamp: Date.now(),
          };

          draft.currentPaths.push(currentStroke);
        }
      }),
      this.liftUpdatedStateUp
    );
  }

  /* Mouse Handlers ends */

  /* Canvas operations */

  setMode(mode: ReactSketchCanvasMode): void {
    this.setState(
      produce((draft: ReactSketchCanvasStates) => {
        draft.drawMode = mode;
      }),
      this.liftUpdatedStateUp
    );
  }

  clearCanvas(): void {
    this.setState(
      produce((draft: ReactSketchCanvasStates) => {
        draft.resetStack = draft.currentPaths;
        draft.currentPaths = [];
        draft.currentTexts = [];
      }),
      this.liftUpdatedStateUp
    );
  }

  undo(): void {
    const { resetStack } = this.state;

    // If there was a last reset then
    if (resetStack.length !== 0) {
      this.setState(
        produce((draft: ReactSketchCanvasStates) => {
          draft.currentPaths = draft.resetStack;
          draft.resetStack = [];
        }),
        this.liftUpdatedStateUp
      );

      return;
    }

    this.setState(
      produce((draft: ReactSketchCanvasStates) => {
        const lastSketchPath = draft.currentPaths.pop();

        if (lastSketchPath) {
          draft.undoStack.push(lastSketchPath);
        }
      }),
      this.liftUpdatedStateUp
    );
  }

  redo(): void {
    const { undoStack } = this.state;

    // Nothing to Redo
    if (undoStack.length === 0) return;

    this.setState(
      produce((draft: ReactSketchCanvasStates) => {
        const lastUndoPath = draft.undoStack.pop();

        if (lastUndoPath) {
          draft.currentPaths.push(lastUndoPath);
        }
      }),
      this.liftUpdatedStateUp
    );
  }

  /* Exporting options */

  // Creates a image from SVG and renders it on canvas, then exports the canvas as image
  exportImage(imageType: ExportImageType): Promise<string> {
    const exportImage = this.svgCanvas.current?.exportImage;

    if (!exportImage) {
      throw Error('Export function called before canvas loaded');
    } else {
      return exportImage(imageType);
    }
  }

  exportSvg(): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      const exportSvg = this.svgCanvas.current?.exportSvg;

      if (!exportSvg) {
        reject(Error('Export function called before canvas loaded'));
      } else {
        exportSvg()
          .then((data) => {
            resolve(data);
          })
          .catch((e) => {
            reject(e);
          });
      }
    });
  }

  exportPaths(): Promise<CanvasPath[]> {
    const { currentPaths } = this.state;

    return new Promise<CanvasPath[]>((resolve, reject) => {
      try {
        resolve(currentPaths);
      } catch (e) {
        reject(e);
      }
    });
  }

  loadPaths(paths: CanvasPath[]): void {
    this.setState(
      produce((draft: ReactSketchCanvasStates) => {
        draft.currentPaths = draft.currentPaths.concat(paths);
      }),
      this.liftUpdatedStateUp
    );
  }

  /* Finally!!! Render method */

  render(): JSX.Element {
    const {
      width,
      height,
      className,
      canvasColor,
      backgroundImage,
      preserveBackgroundImageAspectRatio,
      exportWithBackgroundImage,
      style,
      allowOnlyPointerType,
    } = this.props;

    const { currentPaths, currentTexts, isDrawing } = this.state;

    return (
      <Canvas
        ref={this.svgCanvas}
        width={width}
        height={height}
        className={className}
        canvasColor={canvasColor}
        backgroundImage={backgroundImage}
        exportWithBackgroundImage={exportWithBackgroundImage}
        preserveBackgroundImageAspectRatio={preserveBackgroundImageAspectRatio}
        allowOnlyPointerType={allowOnlyPointerType}
        style={style}
        paths={currentPaths}
        texts={currentTexts}
        isDrawing={isDrawing}
        onPointerDown={this.handlePointerDown}
        onPointerMove={this.handlePointerMove}
        onPointerUp={this.handlePointerUp}
      />
    );
  }
}
