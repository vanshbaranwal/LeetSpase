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
      className={`group relative z-10 touch-none select-none place-items-center bg-[#13161d] outline-none hover:bg-[#1b2029] focus-visible:bg-[#1b2029] active:bg-[#1b2029] ${vertical ? "cursor-col-resize" : "cursor-row-resize"} ${className}`}
    >
      <span
        aria-hidden="true"
        className={`rounded-full bg-[#3b82f6]/35 group-hover:bg-[#3b82f6] group-focus-visible:bg-[#3b82f6] group-active:bg-[#3b82f6] ${vertical ? "h-8 w-0.5" : "h-0.5 w-8"}`}
      />
    </div>
  );
};

export default WorkspaceDivider;
