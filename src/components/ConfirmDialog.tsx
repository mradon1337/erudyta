import { useEffect, useId, useRef } from 'react'
import { Button } from './Button.tsx'
import styles from './ConfirmDialog.module.css'

interface Props {
  open: boolean
  title: string
  text: string
  confirmLabel: string
  cancelLabel: string
  onConfirm: () => void
  onCancel: () => void
}

/** Okno potwierdzenia na natywnym `<dialog>` (pułapka fokusu i Escape z przeglądarki). */
export function ConfirmDialog({ open, title, text, confirmLabel, cancelLabel, onConfirm, onCancel }: Props) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  const textId = useId()

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      className={styles.dialog}
      aria-labelledby={titleId}
      aria-describedby={textId}
      onCancel={(e) => {
        e.preventDefault()
        onCancel()
      }}
    >
      <h2 id={titleId} className={styles.title}>
        {title}
      </h2>
      <p id={textId} className={styles.text}>
        {text}
      </p>
      <div className={styles.actions}>
        <Button variant="primary" block onClick={onCancel} autoFocus>
          {cancelLabel}
        </Button>
        <Button variant="secondary" block onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </div>
    </dialog>
  )
}
