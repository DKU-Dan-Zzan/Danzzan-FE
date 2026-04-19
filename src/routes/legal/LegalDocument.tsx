import { X } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { PRIVACY_POLICY_LINES } from "@/routes/legal/privacyPolicyContent";
import { TERMS_OF_SERVICE_LINES } from "@/routes/legal/termsOfServiceContent";

type LegalDocumentType = "privacy" | "terms";

type LegalDocumentProps = {
  documentType: LegalDocumentType;
};

type LegalDocumentContent = {
  screenTitle: string;
  lines: readonly string[];
};

type LegalParagraphBlock = {
  type: "paragraph";
  text: string;
};

type LegalTableBlock = {
  type: "table";
  headers: string[];
  rows: string[][];
};

type LegalBlock = LegalParagraphBlock | LegalTableBlock;

type LegalRouteState = {
  returnTo?: string;
};

const LEGAL_DOCUMENT_CONTENT: Record<LegalDocumentType, LegalDocumentContent> = {
  privacy: {
    screenTitle: "개인정보처리방침",
    lines: PRIVACY_POLICY_LINES,
  },
  terms: {
    screenTitle: "이용약관",
    lines: TERMS_OF_SERVICE_LINES,
  },
};

const LEGAL_TABLE_DELIMITER = " | ";

const parseTableColumns = (line: string): string[] => {
  return line.split(LEGAL_TABLE_DELIMITER).map((column) => column.trim());
};

const isTableLine = (line: string): boolean => {
  return line.includes(LEGAL_TABLE_DELIMITER);
};

const toLegalBlocks = (lines: readonly string[]): LegalBlock[] => {
  const blocks: LegalBlock[] = [];

  for (let index = 0; index < lines.length; index += 1) {
    const currentLine = lines[index];
    if (!isTableLine(currentLine)) {
      blocks.push({ type: "paragraph", text: currentLine });
      continue;
    }

    const tableRows: string[][] = [];
    let cursor = index;

    while (cursor < lines.length && isTableLine(lines[cursor])) {
      tableRows.push(parseTableColumns(lines[cursor]));
      cursor += 1;
    }

    if (tableRows.length < 2) {
      blocks.push({ type: "paragraph", text: currentLine });
      continue;
    }

    const maxColumnCount = Math.max(...tableRows.map((row) => row.length));
    const normalizedRows = tableRows.map((row) => {
      if (row.length >= maxColumnCount) {
        return row;
      }
      return [...row, ...Array.from({ length: maxColumnCount - row.length }, () => "")];
    });

    blocks.push({
      type: "table",
      headers: normalizedRows[0],
      rows: normalizedRows.slice(1),
    });

    index = cursor - 1;
  }

  return blocks;
};

const isChapterHeadingLine = (line: string): boolean => {
  return /^제\d+장/.test(line.trim());
};

const isArticleHeadingLine = (line: string): boolean => {
  return line.startsWith("제") && line.includes("조");
};

const LegalDocument = ({ documentType }: LegalDocumentProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const routeState = (location.state ?? null) as LegalRouteState | null;
  const content = LEGAL_DOCUMENT_CONTENT[documentType];
  const legalBlocks = toLegalBlocks(content.lines);

  const handleClose = () => {
    navigate(routeState?.returnTo ?? "/mypage", { replace: true });
  };

  return (
    <AppShell
      colorScheme="electric-curator"
      rootClassName="min-h-dvh bg-[var(--bg-page-soft)]"
      frameClassName="mx-auto flex h-dvh max-w-[430px] flex-col bg-[var(--bg-page-soft)]"
      mainClassName="flex-1 overflow-y-auto"
    >
      <section className="sticky top-0 z-20 border-b border-[var(--border-base)] bg-[var(--surface-base)] pt-[env(safe-area-inset-top)]">
        <div className="flex h-20 items-center justify-between px-4">
          <h1 className="text-[1.5rem] font-bold leading-none text-[var(--text)]">
            {content.screenTitle}
          </h1>
          <button
            type="button"
            aria-label="닫기"
            onClick={handleClose}
            className="inline-flex h-12 w-12 items-center justify-center rounded-full text-[var(--text)] transition-colors duration-150 hover:bg-[color-mix(in_srgb,var(--text)_8%,transparent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface-base)]"
          >
            <X size={36} strokeWidth={2.1} />
          </button>
        </div>
      </section>

      <section className="space-y-3 px-4 py-5 pb-[calc(env(safe-area-inset-bottom)+2.25rem)]">
        {legalBlocks.map((block, index) => {
          if (block.type === "table") {
            return (
              <div
                key={`table-${index}`}
                className="overflow-x-auto rounded-xl border border-[var(--border-base)] bg-[var(--surface)]"
              >
                <table className="w-full min-w-[560px] border-collapse text-left text-[0.9rem] leading-[1.65] text-[var(--text)]">
                  <thead>
                    <tr className="bg-[color-mix(in_srgb,var(--surface-base)_88%,var(--text)_2%)]">
                      {block.headers.map((header, headerIndex) => (
                        <th
                          key={`th-${index}-${headerIndex}`}
                          scope="col"
                          className="border-b border-[var(--border-base)] px-3 py-2 font-semibold"
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {block.rows.map((row, rowIndex) => (
                      <tr
                        key={`tr-${index}-${rowIndex}`}
                        className="border-b border-[color-mix(in_srgb,var(--border-base)_65%,transparent)] last:border-b-0"
                      >
                        {row.map((cell, cellIndex) => (
                          <td key={`td-${index}-${rowIndex}-${cellIndex}`} className="px-3 py-2 align-top">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          }

          const line = block.text;
          const isEffectiveDateLine = line.startsWith("시행일자:");
          const isChapterHeading = isChapterHeadingLine(line);
          const isArticleHeading = isArticleHeadingLine(line);
          return (
            <p
              key={`paragraph-${index}-${line.slice(0, 24)}`}
              className={
                isEffectiveDateLine
                  ? "pt-1 text-[1.25rem] font-semibold leading-[1.6] text-[var(--text)]"
                  : isChapterHeading
                    ? "pt-3 text-[1.35rem] font-bold leading-[1.55] text-[var(--text)]"
                  : isArticleHeading
                    ? "pt-2 text-[1.125rem] font-semibold leading-[1.6] text-[var(--text)]"
                    : "text-[0.95rem] leading-[1.75] text-[var(--text-muted)]"
              }
            >
              {line}
            </p>
          );
        })}
      </section>
    </AppShell>
  );
};

export default LegalDocument;
