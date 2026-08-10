<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

type AuthMode = 'password' | 'sms' | 'register' | 'wechat'
type Reaction = 'idle' | 'success' | 'error'

const props = defineProps<{
  mode?: AuthMode
  isTyping?: boolean
  isPasswordActive?: boolean
  isPasswordVisible?: boolean
  isLoading?: boolean
  reaction?: Reaction
}>()

const characters = [
  { key: 'chiikawa', name: '吉伊卡哇' },
  { key: 'hachiware', name: '小八' },
  { key: 'usagi', name: '乌萨奇' }
] as const

const stageRef = ref<HTMLElement | null>(null)
const activeIndex = ref(1)
const isBlinking = ref(false)
const isTapped = ref(false)
const isDragging = ref(false)
const dragOffset = ref(0)
let dragStartX = 0
let animationFrame = 0
let blinkTimer = 0
let tapTimer = 0

const stateClass = computed(() => ({
  [`mode-${props.mode ?? 'password'}`]: true,
  [`reaction-${props.reaction ?? 'idle'}`]: true,
  'is-typing': props.isTyping,
  'is-private': props.isPasswordActive && !props.isPasswordVisible,
  'is-peeking': props.isPasswordActive && props.isPasswordVisible,
  'is-loading': props.isLoading,
  'is-tapped': isTapped.value,
  'is-dragging': isDragging.value
}))

const stageStyle = computed(() => ({ '--drag-x': `${dragOffset.value}px` }))

function slotClass(index: number) {
  const distance = (index - activeIndex.value + characters.length) % characters.length
  if (distance === 0) return 'is-active'
  return distance === 1 ? 'is-next' : 'is-previous'
}

function goTo(index: number) {
  activeIndex.value = (index + characters.length) % characters.length
}

function updateLookTarget(event: PointerEvent) {
  if (!stageRef.value || props.isPasswordActive || isDragging.value) return
  const bounds = stageRef.value.getBoundingClientRect()
  const x = Math.max(-1, Math.min(1, (event.clientX - (bounds.left + bounds.width / 2)) / (bounds.width / 2)))
  const y = Math.max(-1, Math.min(1, (event.clientY - (bounds.top + bounds.height / 2)) / (bounds.height / 2)))
  cancelAnimationFrame(animationFrame)
  animationFrame = requestAnimationFrame(() => {
    stageRef.value?.style.setProperty('--look-x', `${(x * 7).toFixed(2)}px`)
    stageRef.value?.style.setProperty('--look-y', `${(y * 4).toFixed(2)}px`)
  })
}

function resetLookTarget() {
  stageRef.value?.style.setProperty('--look-x', '0px')
  stageRef.value?.style.setProperty('--look-y', '0px')
}

function reactToTap() {
  isTapped.value = false
  window.clearTimeout(tapTimer)
  requestAnimationFrame(() => {
    isTapped.value = true
    tapTimer = window.setTimeout(() => { isTapped.value = false }, 620)
  })
}

function startDrag(event: PointerEvent) {
  if ((event.target as HTMLElement).closest('button')) return
  dragStartX = event.clientX
  dragOffset.value = 0
  isDragging.value = true
  stageRef.value?.setPointerCapture(event.pointerId)
}

function moveDrag(event: PointerEvent) {
  if (!isDragging.value) return
  dragOffset.value = Math.max(-92, Math.min(92, event.clientX - dragStartX))
}

function finishDrag(event: PointerEvent) {
  if (!isDragging.value) return
  const movement = dragOffset.value
  isDragging.value = false
  dragOffset.value = 0
  if (stageRef.value?.hasPointerCapture(event.pointerId)) stageRef.value.releasePointerCapture(event.pointerId)
  if (movement < -34) goTo(activeIndex.value + 1)
  else if (movement > 34) goTo(activeIndex.value - 1)
  else reactToTap()
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'ArrowLeft') {
    event.preventDefault()
    goTo(activeIndex.value - 1)
  } else if (event.key === 'ArrowRight') {
    event.preventDefault()
    goTo(activeIndex.value + 1)
  }
}

function scheduleBlink() {
  blinkTimer = window.setTimeout(() => {
    isBlinking.value = true
    window.setTimeout(() => {
      isBlinking.value = false
      scheduleBlink()
    }, 140)
  }, 2800 + Math.random() * 3200)
}

onMounted(() => {
  window.addEventListener('pointermove', updateLookTarget, { passive: true })
  scheduleBlink()
})

onBeforeUnmount(() => {
  window.removeEventListener('pointermove', updateLookTarget)
  window.clearTimeout(blinkTimer)
  window.clearTimeout(tapTimer)
  cancelAnimationFrame(animationFrame)
})
</script>

<template>
  <div
    ref="stageRef"
    class="character-stage"
    :class="[stateClass, { 'is-blinking': isBlinking }]"
    :style="stageStyle"
    role="region"
    aria-roledescription="轮播图"
    :aria-label="`登录角色轮播，当前为${characters[activeIndex].name}`"
    tabindex="0"
    @pointerdown="startDrag"
    @pointermove="moveDrag"
    @pointerup="finishDrag"
    @pointercancel="finishDrag"
    @pointerleave="resetLookTarget"
    @keydown="handleKeydown"
  >
    <div class="stage-line"></div>

    <div
      v-for="(character, index) in characters"
      :key="character.key"
      class="carousel-character"
      :class="[`character-${character.key}`, slotClass(index)]"
      :aria-hidden="index !== activeIndex"
    >
      <div class="mascot">
        <div class="mascot-motion">
          <img class="pose pose-normal" :src="`/images/characters/${character.key}-login.png`" alt="" draggable="false" />
          <img class="pose pose-cover" :src="`/images/characters/${character.key}-cover.png`" alt="" draggable="false" />
          <i class="lid lid-left"></i><i class="lid lid-right"></i>
        </div>
      </div>
    </div>

  </div>
</template>

<style scoped>
.character-stage {
  --look-x: 0px;
  --look-y: 0px;
  --drag-x: 0px;
  position: relative;
  width: min(100%, 390px);
  height: 184px;
  margin: -8px auto -2px;
  overflow: hidden;
  touch-action: pan-y;
  cursor: grab;
  outline: none;
  user-select: none;
}

.character-stage.is-dragging { cursor: grabbing; }
.character-stage:focus-visible { outline: 2px solid #2563eb; outline-offset: 3px; border-radius: 8px; }
.stage-line { position: absolute; right: 10px; bottom: 0; left: 10px; height: 1px; background: #dbe8f7; }

.carousel-character {
  position: absolute;
  left: 50%;
  bottom: 0;
  width: 182px;
  height: 182px;
  transform-origin: bottom center;
  transition: transform .42s cubic-bezier(.2, .75, .2, 1), opacity .3s ease, filter .3s ease;
  pointer-events: none;
}

.carousel-character.is-active { z-index: 3; opacity: 1; transform: translateX(calc(-50% + var(--drag-x))) scale(1.01); filter: none; pointer-events: auto; }
.carousel-character.is-previous { z-index: 2; opacity: .84; transform: translateX(calc(-50% - 112px + var(--drag-x))) scale(.78); filter: saturate(.9); }
.carousel-character.is-next { z-index: 2; opacity: .84; transform: translateX(calc(-50% + 112px + var(--drag-x))) scale(.78); filter: saturate(.9); }
.character-stage.is-dragging .carousel-character { transition-duration: 0s; }

.mascot, .mascot-motion { position: relative; width: 100%; height: 100%; }
.mascot { animation: mascot-breathe 3.2s ease-in-out infinite; }
.character-chiikawa .mascot { animation-delay: -.9s; }
.character-usagi .mascot { animation-delay: -1.8s; }
.mascot-motion { transition: transform .22s ease; }
.carousel-character.is-active .mascot-motion:hover { transform: translateY(-5px) scale(1.02); }
.mascot img { width: 100%; height: 100%; display: block; object-fit: contain; user-select: none; transform: translate(calc(var(--look-x) * .22), calc(var(--look-y) * .18)); transition: opacity .2s ease, transform .18s ease, filter .25s ease; }
.pose-cover { position: absolute; inset: 0; opacity: 0; }
.character-stage.is-private .pose-normal { opacity: 0; }
.character-stage.is-private .pose-cover { opacity: 1; }

.lid { position: absolute; z-index: 5; top: 39%; width: 13px; height: 5px; border-bottom: 2px solid #5b3026; border-radius: 50%; background: #fffaf6; opacity: 0; transform: translateY(2px); }
.lid-left { left: 40%; }
.lid-right { right: 38%; }
.character-hachiware .lid { top: 41%; background: #fff; }
.character-usagi .lid { top: 38%; background: #fff6dd; }
.character-stage.is-blinking:not(.is-private) .is-active .lid { opacity: 1; }

.character-stage.is-typing:not(.is-private, .is-peeking) .is-previous .mascot-motion { transform: rotate(5deg) translateX(7px); }
.character-stage.is-typing:not(.is-private, .is-peeking) .is-next .mascot-motion { transform: rotate(-5deg) translateX(-7px); }
.character-stage.is-typing:not(.is-private, .is-peeking) .is-active .mascot-motion { transform: translateY(-4px); }
.character-stage.is-private .is-previous .mascot-motion { transform: rotate(-5deg) translateY(8px); }
.character-stage.is-private .is-active .mascot-motion { transform: translateY(5px); }
.character-stage.is-private .is-next .mascot-motion { transform: rotate(5deg) translateY(8px); }
.character-stage.is-peeking .is-previous .mascot-motion { transform: rotate(-5deg) translateY(8px); }
.character-stage.is-peeking .is-active .mascot-motion { transform: translateY(-5px); }
.character-stage.is-peeking .is-next .mascot-motion { transform: rotate(5deg) translateY(8px); }
.character-stage.is-peeking .mascot img { filter: saturate(1.06); }

.character-stage.mode-sms:not(.is-private, .is-loading) .character-usagi .mascot-motion { animation: listen 1.8s ease-in-out infinite; }
.character-stage.mode-register:not(.is-loading) .is-active .mascot-motion { transform: translateY(-7px); }
.character-stage.mode-wechat:not(.is-loading) .character-hachiware .mascot-motion { animation: friendly-wave 1.7s ease-in-out infinite; }
.character-stage.is-loading .mascot-motion { animation: waiting-bob .75s ease-in-out infinite alternate; }
.character-stage.is-loading .is-active .mascot-motion { animation-delay: .12s; }
.character-stage.is-loading .is-next .mascot-motion { animation-delay: .24s; }
.character-stage.reaction-error { animation: stage-shake .42s ease both; }
.character-stage.reaction-error .mascot img { filter: saturate(.72) brightness(.96); }
.character-stage.reaction-success .mascot-motion { animation: celebrate .58s cubic-bezier(.22, .8, .32, 1) both; }
.character-stage.reaction-success .is-active .mascot-motion { animation-delay: .08s; }
.character-stage.reaction-success .is-next .mascot-motion { animation-delay: .16s; }
.character-stage.is-tapped .is-active .mascot-motion { animation: surprised .58s ease both; }

@keyframes mascot-breathe { 0%, 100% { transform: translateY(0) scaleY(1); } 50% { transform: translateY(-2px) scaleY(1.012); } }
@keyframes listen { 0%, 100% { transform: rotate(0); } 35% { transform: rotate(4deg) translateY(-2px); } 70% { transform: rotate(-2deg); } }
@keyframes friendly-wave { 0%, 100% { transform: rotate(0); } 40% { transform: rotate(-3deg) translateY(-3px); } 70% { transform: rotate(3deg) translateY(-2px); } }
@keyframes waiting-bob { from { transform: translateY(1px); } to { transform: translateY(-6px); } }
@keyframes stage-shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-5px); } 50% { transform: translateX(4px); } 75% { transform: translateX(-2px); } }
@keyframes celebrate { 0%, 100% { translate: 0 0; } 46% { translate: 0 -14px; scale: 1.04; } }
@keyframes surprised { 0%, 100% { transform: translateY(0) scale(1); } 40% { transform: translateY(-10px) scale(1.07); } }

@media (max-width: 480px) {
  .character-stage { height: 186px; }
  .carousel-character { width: 164px; height: 164px; }
  .carousel-character.is-active { transform: translateX(calc(-50% + var(--drag-x))) scale(1); }
  .carousel-character.is-previous { transform: translateX(calc(-50% - 94px + var(--drag-x))) scale(.76); }
  .carousel-character.is-next { transform: translateX(calc(-50% + 94px + var(--drag-x))) scale(.76); }
}

@media (prefers-reduced-motion: reduce) {
  .character-stage, .carousel-character, .mascot, .mascot-motion, .mascot img, .lid { animation: none !important; transition: none; }
}
</style>
