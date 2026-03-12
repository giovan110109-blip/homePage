import { ref, nextTick, onMounted, onUnmounted } from 'vue'
import { useEmotes } from './useEmotes'

export interface EmotePickerOptions {
  onInsert?: (emoteName: string, emoteUrl: string) => void
}

export function useEmotePicker(options: EmotePickerOptions = {}) {
  const { onInsert } = options
  const { getEmoteUrl } = useEmotes()

  const showEmotePicker = ref(false)
  const emotePickerRef = ref<HTMLDivElement | null>(null)
  const emoteButtonRef = ref<HTMLButtonElement | null>(null)
  const emotePickerPosition = ref({ top: 0, right: 0 })

  const updatePosition = () => {
    if (!emoteButtonRef.value) return

    const rect = emoteButtonRef.value.getBoundingClientRect()
    const pickerWidth = Math.min(window.innerWidth - 32, 600)
    const pickerHeight = Math.min(window.innerHeight - 32, 450)

    let top = rect.top - pickerHeight - 8
    let right = window.innerWidth - rect.right

    if (top < 16) {
      top = rect.bottom + 8
    }

    if (right < 16) {
      right = 16
    }

    emotePickerPosition.value = { top, right }
  }

  const toggle = () => {
    showEmotePicker.value = !showEmotePicker.value
    if (showEmotePicker.value) {
      nextTick(updatePosition)
    }
  }

  const select = (emoteName: string) => {
    const emoteUrl = getEmoteUrl(emoteName)
    if (onInsert && emoteUrl) {
      onInsert(emoteName, emoteUrl)
    }
    showEmotePicker.value = false
  }

  const handleClickOutside = (event: MouseEvent) => {
    const target = event.target as Node
    if (emotePickerRef.value && !emotePickerRef.value.contains(target)) {
      showEmotePicker.value = false
    }
  }

  const handleScroll = () => {
    if (showEmotePicker.value) {
      updatePosition()
    }
  }

  onMounted(() => {
    nextTick(() => {
      document.addEventListener('click', handleClickOutside)
      window.addEventListener('scroll', handleScroll, true)
      window.addEventListener('resize', handleScroll)
    })
  })

  onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside)
    window.removeEventListener('scroll', handleScroll, true)
    window.removeEventListener('resize', handleScroll)
  })

  return {
    showEmotePicker,
    emotePickerRef,
    emoteButtonRef,
    emotePickerPosition,
    toggleEmotePicker: toggle,
    selectEmote: select,
    updateEmotePickerPosition: updatePosition,
  }
}
