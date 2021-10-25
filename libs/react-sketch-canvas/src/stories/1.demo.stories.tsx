/* eslint-disable react/no-danger */
/* eslint-disable jsx-a11y/label-has-associated-control */

import { Meta, Story } from '@storybook/react';
import * as React from 'react';
import {
  CanvasText,
  CanvasPath,
  ReactSketchCanvas,
  ReactSketchCanvasProps, CanvasMode
} from '..';
import './demo.stories.css';

export default {
  title: 'Demo/With Reference',
  component: ReactSketchCanvas,
  argTypes: {
    allowOnlyPointerType: {
      options: ['mouse', 'touch', 'pen', 'all'],
      control: { type: 'radio' },
    },
    strokeColor: {
      control: { type: 'color' },
    },
  },
} as Meta;

type CanvasRef = React.RefObject<ReactSketchCanvas>;
type Handlers = [string, () => void, string][];

const Template: Story<ReactSketchCanvasProps> = ({
  className,
  width,
  height,
  backgroundImage,
  exportWithBackgroundImage,
  preserveBackgroundImageAspectRatio,
  strokeWidth,
  strokeColor,
  canvasColor,
  eraserWidth,
  allowOnlyPointerType,
  style,
  withTimestamp,
}) => {
  const canvasRef: CanvasRef = React.useRef<ReactSketchCanvas>(null);

  const [dataURI, setDataURI] = React.useState<string>('');
  const [svg, setSVG] = React.useState<string>('');
  const [paths, setPaths] = React.useState<CanvasPath[]>([]);
  const [texts, setTexts] = React.useState<CanvasText[]>([]);
  const [sketchingTime, setSketchingTime] = React.useState<number>(0);

  const imageExportHandler = async () => {
    const exportImage = canvasRef.current?.exportImage;

    if (exportImage) {
      const exportedDataURI = await exportImage('png');
      setDataURI(exportedDataURI);
    }
  };

  const svgExportHandler = async () => {
    const exportSvg = canvasRef.current?.exportSvg;

    if (exportSvg) {
      const exportedDataURI = await exportSvg();
      setSVG(exportedDataURI);
    }
  };

  const getSketchingTimeHandler = async () => {
    const getSketchingTime = canvasRef.current?.getSketchingTime;

    if (getSketchingTime) {
      const currentSketchingTime = await getSketchingTime();
      setSketchingTime(currentSketchingTime);
    }
  };

  const penHandler = () => {
    const setMode = canvasRef.current?.setMode;

    if (setMode) {
      setMode(CanvasMode.pen);
    }
  };

  const textHandler = () => {
    const setMode = canvasRef.current?.setMode;

    if (setMode) {
      setMode(CanvasMode.text);
    }
  };

  const eraserHandler = () => {
    const setMode = canvasRef.current?.setMode;

    if (setMode) {
      setMode(CanvasMode.eraser);
    }
  };

  const disableHandler = () => {
    const setMode = canvasRef.current?.setMode;

    if (setMode) {
      setMode(CanvasMode.none);
    }
  };


  const undoHandler = () => {
    const undo = canvasRef.current?.undo;

    if (undo) {
      undo();
    }
  };

  const redoHandler = () => {
    const redo = canvasRef.current?.redo;

    if (redo) {
      redo();
    }
  };

  const clearHandler = () => {
    const clearCanvas = canvasRef.current?.clearCanvas;

    if (clearCanvas) {
      clearCanvas();
    }
  };

  const resetCanvasHandler = () => {
    const resetCanvas = canvasRef.current?.resetCanvas;

    if (resetCanvas) {
      resetCanvas();
    }
  };

  const createButton = (
    label: string,
    handler: () => void,
    themeColor: string
  ) => (
    <button
      key={label}
      className={`btn btn-${themeColor} btn-block`}
      type="button"
      onClick={handler}
    >
      {label}
    </button>
  );

  const buttonsWithHandlers: Handlers = [
    ['Undo', undoHandler, 'primary'],
    ['Redo', redoHandler, 'primary'],
    ['Clear All', clearHandler, 'primary'],
    ['Reset All', resetCanvasHandler, 'primary'],
    ['Pen', penHandler, 'secondary'],
    ['Text', textHandler, 'secondary'],
    ['Eraser', eraserHandler, 'secondary'],
    ['Disable', disableHandler, 'secondary'],
    ['Export Image', imageExportHandler, 'success'],
    ['Export SVG', svgExportHandler, 'success'],
    ['Get Sketching time', getSketchingTimeHandler, 'success'],
  ];

  const onUpdate = (updatedPaths: CanvasPath[], updatedTexts: CanvasText[]): void => {
    setPaths(updatedPaths);
    setTexts(updatedTexts);
  };

  return (
    <div>
      <div className="container-md">
        <div className="row no-gutters canvas-area m-0 p-0">
          <div className="col-9 canvas p-0">
            <ReactSketchCanvas
              ref={canvasRef}
              className={className}
              width={width}
              height={height}
              backgroundImage={backgroundImage}
              exportWithBackgroundImage={exportWithBackgroundImage}
              preserveBackgroundImageAspectRatio={
                preserveBackgroundImageAspectRatio
              }
              strokeWidth={strokeWidth}
              strokeColor={strokeColor}
              canvasColor={canvasColor}
              eraserWidth={eraserWidth}
              allowOnlyPointerType={allowOnlyPointerType}
              style={style}
              onUpdate={onUpdate}
              withTimestamp={withTimestamp}
            />
          </div>
          <div className="col-3 panel">
            <div className="d-grid gap-2">
              {buttonsWithHandlers.map(([label, handler, themeColor]) =>
                createButton(label, handler, themeColor)
              )}
            </div>
          </div>
        </div>

        <div className="row image-export mt-5 p-3 justify-content-center align-items-start">
          <div className="col-5 row form-group">
            <label className="col-12" htmlFor="dataURI">
              Paths
            </label>
            <textarea
              id="dataURI"
              className="dataURICode col-12"
              readOnly
              rows={10}
              value={
                paths.length !== 0
                  ? JSON.stringify(paths)
                  : 'Sketch to get paths'
              }
            />
          </div>
          <div className="col-5 row form-group">
            <label className="col-12" htmlFor="dataTextURI">
              Texts
            </label>
            <textarea
              id="dataTextURI"
              className="dataURICode col-12"
              readOnly
              rows={10}
              value={
                texts.length !== 0
                  ? JSON.stringify(texts)
                  : 'Sketch to get texts'
              }
            />
          </div>
          <div className="col-2">
            <label className="col-12" htmlFor="dataURI">
              Sketching time
            </label>
            <div className="sketchingTime">
              {(sketchingTime / 1000).toFixed(3)} sec
            </div>
          </div>
        </div>

        <div className="row image-export p-3 justify-content-center align-items-start">
          <div className="col-5 row form-group">
            <label className="col-12" htmlFor="dataURI">
              Exported Data URI for imagetype
            </label>
            <textarea
              id="dataURI"
              className="dataURICode col-12"
              readOnly
              rows={10}
              value={dataURI || 'Click on export image'}
            />
          </div>
          <div className="col-5 offset-2">
            <p>Exported image</p>
            <img
              className="exported-image"
              src={
                dataURI ||
                'https://via.placeholder.com/500x250/000000/FFFFFF/?text=Click on export image'
              }
              alt="exported"
            />
          </div>
        </div>

        <div className="row image-export p-3 justify-content-center align-items-start">
          <div className="col-5 row form-group">
            <label className="col-12" htmlFor="dataURI">
              Exported SVG code
            </label>
            <textarea
              id="dataURI"
              className="dataURICode col-12"
              readOnly
              rows={10}
              value={svg || 'Click on export svg'}
            />
          </div>
          <div className="col-5 offset-2">
            <p>Exported SVG</p>
            {svg ? (
              <span
                className="exported-image"
                dangerouslySetInnerHTML={{ __html: svg }}
              />
            ) : (
              <img
                src="https://via.placeholder.com/500x250/000000/FFFFFF/?text=Click on export SVG"
                alt="Svg Export"
                className="exported-image"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export const Default = Template.bind({});
Default.args = {
  className: 'react-sketch-canvas',
  width: '100%',
  height: '500px',
  backgroundImage:
    'https://upload.wikimedia.org/wikipedia/commons/7/70/Graph_paper_scan_1600x1000_%286509259561%29.jpg',
  exportWithBackgroundImage: true,
  preserveBackgroundImageAspectRatio: 'none',
  strokeWidth: 4,
  strokeColor: '#000000',
  canvasColor: '#FFFFFF',
  eraserWidth: 5,
  allowOnlyPointerType: 'all',
  style: { borderRight: '1px solid #CCC' },
  withTimestamp: true,
};
