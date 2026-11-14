// The site's X mark, drawn inline so its navy part can turn light in dark mode.
export function LogoMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="204 353 844 585" className={className} aria-hidden="true" focusable="false">
      <polygon
        className="fill-[#04356D] dark:fill-[#F2F4F7]"
        points="204,353 500,353 798,676 692,790 918,790 1048,938 685,938 559,800 651,699 449,480 316,480"
      />
      <polygon className="fill-[#008CFB] dark:fill-[#33ADFF]" points="766,353 1048,353 922,480 807,480 709,578 627,490" />
      <path className="fill-[#008CFB] dark:fill-[#33ADFF]" d="M530,620 L613,713 L396,938 L211,938 Q395,800 530,620 Z" />
    </svg>
  );
}
