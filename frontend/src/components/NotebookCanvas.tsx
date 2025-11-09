import type {
  FormHTMLAttributes,
  HTMLAttributes,
  ReactNode,
} from "react";
import ringsArt from "../assets/rings.png";

type NotebookCanvasBaseProps = {
  children: ReactNode;
  className?: string;
};

type NotebookCanvasDivProps = NotebookCanvasBaseProps & {
  as?: "div";
} & HTMLAttributes<HTMLDivElement>;

type NotebookCanvasFormProps = NotebookCanvasBaseProps & {
  as: "form";
} & FormHTMLAttributes<HTMLFormElement>;

type NotebookCanvasProps = NotebookCanvasDivProps | NotebookCanvasFormProps;

const NotebookCanvas = ({
  as = "div",
  children,
  className,
  ...rest
}: NotebookCanvasProps) => {
  const combinedClassNames = [
    "notebook-canvas relative flex w-full flex-col items-center gap-6 rounded-[32px] border border-slate-700 bg-slate-900/80 px-10 py-16 text-center text-slate-100 shadow-[0_40px_100px_-40px_rgba(8,47,73,0.75)] transition-[box-shadow,transform]",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const content = (
    <>
      <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 -translate-y-[45%] select-none">
        <img
          src={ringsArt}
          alt="Notebook binding rings"
          className="scale-200"
          draggable={false}
        />
      </div>
      {children}
    </>
  );

  if (as === "form") {
    const formProps = rest as FormHTMLAttributes<HTMLFormElement>;
    return (
      <form
        className={combinedClassNames}
        {...formProps}
      >
        {content}
      </form>
    );
  }

  const divProps = rest as HTMLAttributes<HTMLDivElement>;
  return (
    <div
      className={combinedClassNames}
      {...divProps}
    >
      {content}
    </div>
  );
};

export default NotebookCanvas;


