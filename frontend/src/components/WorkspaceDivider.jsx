import { useRef } from "react";

const WorkspaceDivider = ({
  label,
  controls,
  orientation,
  value,
  min,
  max,
  defaultValue,
  onChange,
  className = "grid",
}) => {
  const dragStart = useRef(null);
  const vertical = orientation === "vertical";

  const resize = (nextValue) => {
    onChange(Math.min(max, Math.max(min, Math.round(nextValue))));
  };

  const getPosition = (event) => vertical ? event.clientX : event.clientY;

  const handlePointerDown = (event) => {
    if (!event.isPrimary || event.button !== 0) return;

    const divider = event.currentTarget;
    const container = divider.parentElement;
    const availableSpace = vertical
      ? container.clientWidth - divider.offsetWidth
      : container.clientHeight - divider.offsetHeight;
    if (availableSpace <= 0) return;

    dragStart.current = { position: getPosition(event), availableSpace, value };
    divider.setPointerCapture(event.pointerId);
    divider.focus({ preventScroll: true });
    event.preventDefault();
  };

  const handlePointerMove = (event) => {
    if (!dragStart.current || !event.currentTarget.hasPointerCapture(event.pointerId)) return;

    const start = dragStart.current;
    resize(start.value + ((getPosition(event) - start.position) / start.availableSpace) * 100);
  };

  const handleKeyDown = (event) => {
    const decrease = vertical ? "ArrowLeft" : "ArrowUp";
    const increase = vertical ? "ArrowRight" : "ArrowDown";
    const step = event.shiftKey ? 10 : 2;
    const nextValues = {
      [decrease]: value - step,
      [increase]: value + step,
      Home: min,
      End: max,
      Enter: defaultValue,
    };
    if (!Object.hasOwn(nextValues, event.key)) return;

    event.preventDefault();
    resize(nextValues[event.key]);
  };

  return (
    <div
      role="separator"
      tabIndex={0}
      aria-label={label}
      aria-controls={controls}
      aria-orientation={orientation}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-valuetext={`${value}%`}
      title={`${label}. Double-click to reset.`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onLostPointerCapture={() => { dragStart.current = null; }}
      onKeyDown={handleKeyDown}
      onDoubleClick={() => resize(defaultValue)}
      className={`group relative z-10 touch-none select-none place-items-center bg-[#111e36] outline-none hover:bg-[#203451] focus-visible:bg-[#203451] active:bg-[#203451] ${vertical ? "cursor-col-resize" : "cursor-row-resize"} ${className}`}
    >
      <span
        aria-hidden="true"
        className={`rounded-full bg-[#a9b8ff]/35 group-hover:bg-[#a9b8ff] group-focus-visible:bg-[#a9b8ff] group-active:bg-[#a9b8ff] ${vertical ? "h-8 w-0.5" : "h-0.5 w-8"}`}
      />
    </div>
  );
};

export default WorkspaceDivider;
