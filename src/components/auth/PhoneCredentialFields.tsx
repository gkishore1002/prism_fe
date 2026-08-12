import { phoneToLoginEmail } from '@/lib/phoneAuth'

const inputClass = 'mt-1 w-full border border-border rounded-md px-3 py-2 text-sm bg-background'

interface PhoneCredentialFieldsProps {
  phone: string
  onPhoneChange: (value: string) => void
  password?: string
  onPasswordChange?: (value: string) => void
  phoneRequired?: boolean
  showPassword?: boolean
  passwordHint?: string
  idPrefix?: string
}

export function PhoneCredentialFields({
  phone,
  onPhoneChange,
  password = '',
  onPasswordChange,
  phoneRequired = true,
  showPassword = true,
  passwordHint = 'Leave blank to use the phone number as the initial password.',
  idPrefix = 'phone-cred',
}: PhoneCredentialFieldsProps) {
  const loginEmail = phoneToLoginEmail(phone)

  return (
    <>
      <label className="block">
        <span className="text-xs text-muted-foreground">Phone number{phoneRequired ? ' *' : ''}</span>
        <input
          id={`${idPrefix}-phone`}
          type="tel"
          inputMode="numeric"
          autoComplete="tel"
          required={phoneRequired}
          value={phone}
          onChange={(e) => onPhoneChange(e.target.value)}
          className={inputClass}
          placeholder="9876543210"
        />
        <p className="mt-1 text-[11px] text-muted-foreground">
          Login email:{' '}
          <span className="font-medium text-foreground">{loginEmail || 'Enter a valid phone number'}</span>
        </p>
      </label>
      {showPassword && onPasswordChange && (
        <label className="block">
          <span className="text-xs text-muted-foreground">Password (optional)</span>
          <input
            id={`${idPrefix}-password`}
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => onPasswordChange(e.target.value)}
            className={inputClass}
            placeholder="Same as phone number if left blank"
          />
          <p className="mt-1 text-[11px] text-muted-foreground">{passwordHint}</p>
        </label>
      )}
    </>
  )
}
