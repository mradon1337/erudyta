import type { ButtonHTMLAttributes } from 'react'
import { Icon, type IconName } from './Icon.tsx'
import styles from './IconButton.module.css'

interface Props extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  icon: IconName
  /** Opis przycisku dla czytnika ekranu (przycisk nie ma widocznego tekstu). */
  label: string
}

export function IconButton({ icon, label, className, type = 'button', ...rest }: Props) {
  return (
    <button type={type} aria-label={label} className={`${styles.iconButton} ${className ?? ''}`} {...rest}>
      <Icon name={icon} size={20} strokeWidth={2.2} />
    </button>
  )
}
