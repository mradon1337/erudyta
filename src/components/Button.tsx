import type { ButtonHTMLAttributes, Ref } from 'react'
import styles from './Button.module.css'
import { Icon, type IconName } from './Icon.tsx'

export type ButtonVariant = 'primary' | 'play' | 'dark' | 'secondary' | 'text'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  /** Ikona przed tekstem (np. ▶ na „Graj”). */
  iconStart?: IconName
  /** Ikona za tekstem (np. strzałka na „Dalej”). */
  iconEnd?: IconName
  /** Na całą szerokość kolumny. */
  block?: boolean
  ref?: Ref<HTMLButtonElement>
}

export function Button({
  variant = 'primary',
  iconStart,
  iconEnd,
  block = false,
  className,
  children,
  type = 'button',
  ...rest
}: Props) {
  const classes = [styles.button, styles[variant], block ? styles.block : '', className ?? ''].join(' ')
  return (
    <button type={type} className={classes} {...rest}>
      {iconStart && <Icon name={iconStart} size={18} />}
      {children}
      {iconEnd && <Icon name={iconEnd} size={20} strokeWidth={2.2} />}
    </button>
  )
}
