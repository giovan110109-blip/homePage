export interface EmoteItem {
  name: string
  url: string
  group: string
}

export interface EmoteGroup {
  name: string
  emotes: EmoteItem[]
}

export interface EmotePickerProps {
  modelValue?: string
  disabled?: boolean
  placeholder?: string
}

export interface EmoteDisplayProps {
  emote: string
  size?: number
  lazy?: boolean
}
