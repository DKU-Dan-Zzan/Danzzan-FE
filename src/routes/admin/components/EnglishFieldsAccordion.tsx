// 역할: 관리자 등록/수정 폼에서 영문 번역을 접이식으로 확인하고 수정하게 한다.

type EnglishField = {
  name: string
  label: string
  value: string
  multiline: boolean
}

type EnglishFieldsAccordionProps = {
  fields: EnglishField[]
  isManual: boolean
  onChange: (name: string, value: string) => void
}

const EnglishFieldsAccordion = ({
  fields,
  isManual,
  onChange,
}: EnglishFieldsAccordionProps) => {
  return (
    <details className="mt-4 rounded-lg border border-[var(--border)] px-4 py-3">
      <summary className="cursor-pointer text-sm font-semibold text-[var(--text)]">
        영어 번역{" "}
        <span className="ml-1 text-xs font-normal text-[var(--text-muted)]">
          {isManual ? "· 직접 입력함" : "· 비워두면 자동 번역"}
        </span>
      </summary>

      <p className="mt-2 text-xs leading-5 text-[var(--text-muted)]">
        비워두면 저장할 때 자동으로 번역됩니다. 직접 입력하면 자동 번역이 덮어쓰지
        않습니다.
      </p>

      <div className="mt-3 flex flex-col gap-3">
        {fields.map((field) => (
          <label key={field.name} className="flex flex-col gap-1">
            <span className="text-xs font-medium text-[var(--text-muted)]">
              {field.label}
            </span>
            {field.multiline ? (
              <textarea
                name={field.name}
                value={field.value}
                rows={4}
                onChange={(event) => onChange(field.name, event.target.value)}
                className="w-full rounded-md border border-[var(--border)] px-3 py-2 text-sm"
              />
            ) : (
              <input
                type="text"
                name={field.name}
                value={field.value}
                onChange={(event) => onChange(field.name, event.target.value)}
                className="w-full rounded-md border border-[var(--border)] px-3 py-2 text-sm"
              />
            )}
          </label>
        ))}
      </div>
    </details>
  )
}

export default EnglishFieldsAccordion
