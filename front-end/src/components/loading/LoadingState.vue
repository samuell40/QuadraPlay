<template>
  <section :class="['loading-state', `loading-state--${size}`, `loading-state--${theme}`]" role="status" aria-live="polite">
    <div class="loading-illustration" aria-hidden="true">
      <img class="loading-player-art" :src="loadingArt" alt="" />

      <span class="loading-ball-shadow"></span>
      <div class="loading-ball-wrap">
        <img class="loading-ball-art" :src="ballArt" alt="" />
      </div>
    </div>

    <div class="loading-copy">
      <p class="loading-title">{{ title }}</p>
      <p v-if="description" class="loading-description">{{ description }}</p>
    </div>
  </section>
</template>

<script>
import loadingArt from '@/assets/loading/loading.png'
import ballArt from '@/assets/loading/bola.png'

export default {
  name: 'LoadingState',
  data() {
    return {
      loadingArt,
      ballArt
    }
  },
  props: {
    title: {
      type: String,
      required: true
    },
    description: {
      type: String,
      default: ''
    },
    size: {
      type: String,
      default: 'default',
      validator(value) {
        return ['default', 'compact'].includes(value)
      }
    },
    theme: {
      type: String,
      default: 'default',
      validator(value) {
        return ['default', 'danger'].includes(value)
      }
    }
  }
}
</script>

<style scoped>
.loading-state {
  --loading-accent-rgb: 37, 99, 235;
  --loading-title-color: #0f172a;
  --loading-border-color: rgba(148, 163, 184, 0.34);
  --loading-surface-color: rgba(248, 250, 252, 0.9);
  --loading-visual-size: clamp(130px, 34vw, 220px);
  --loading-min-height: clamp(130px, 36vw, 210px);
  --loading-title-size: clamp(22px, 6.2vw, 34px);
  --loading-description-size: clamp(14px, 3.4vw, 17px);
  --loading-copy-gap: 10px;
  --loading-padding-y: clamp(18px, 4.6vw, 30px);
  --loading-padding-x: clamp(14px, 4vw, 24px);
  width: 100%;
  min-height: var(--loading-min-height);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: clamp(10px, 2.8vw, 20px);
  padding: var(--loading-padding-y) var(--loading-padding-x);
  text-align: center;
  border-radius: 28px;
  border: 1.5px dashed var(--loading-border-color);
  background: var(--loading-surface-color);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.76);
  overflow: hidden;
  container-type: inline-size;
}

.loading-state--danger {
  --loading-accent-rgb: 185, 28, 28;
  --loading-title-color: #991b1b;
  --loading-border-color: rgba(239, 68, 68, 0.35);
  --loading-surface-color: rgba(254, 242, 242, 0.88);
}

.loading-state--compact {
  --loading-visual-size: clamp(92px, 30vw, 148px);
  --loading-min-height: clamp(98px, 28vw, 148px);
  --loading-title-size: clamp(18px, 5.2vw, 24px);
  --loading-description-size: clamp(12px, 3.2vw, 14px);
  --loading-copy-gap: 8px;
  --loading-padding-y: clamp(12px, 3.4vw, 18px);
  --loading-padding-x: clamp(12px, 3.4vw, 18px);
  border-radius: 22px;
}

.loading-illustration {
  position: relative;
  width: min(100%, var(--loading-visual-size));
  aspect-ratio: 16 / 10;
  max-height: 138px;
  display: flex;
  align-items: center;
  justify-content: center;
  isolation: isolate;
}

.loading-state--compact .loading-illustration {
  max-height: 92px;
}

.loading-player-art {
  width: 100%;
  height: 100%;
  object-fit: contain;
  user-select: none;
  pointer-events: none;
  filter: drop-shadow(0 8px 18px rgba(var(--loading-accent-rgb), 0.24));
}

.loading-ball-shadow {
  position: absolute;
  right: 16%;
  bottom: 17.5%;
  width: 17%;
  height: 9px;
  border-radius: 999px;
  background: radial-gradient(circle, rgba(15, 23, 42, 0.34) 0%, rgba(15, 23, 42, 0) 72%);
  animation: ballShadow 1.25s ease-in-out infinite;
  transform-origin: center;
}

.loading-ball-wrap {
  position: absolute;
  right: 15.5%;
  bottom: 19%;
  width: 19%;
  max-width: 66px;
  min-width: 34px;
  animation: ballJump 1.25s ease-in-out infinite;
  will-change: transform;
}

.loading-ball-art {
  width: 100%;
  height: 100%;
  user-select: none;
  pointer-events: none;
  filter: drop-shadow(0 0 8px rgba(var(--loading-accent-rgb), 0.42));
  animation: ballSpin 0.9s linear infinite;
}

.loading-state--compact .loading-player-art {
  filter: drop-shadow(0 6px 12px rgba(var(--loading-accent-rgb), 0.22));
}

.loading-state--compact .loading-ball-shadow {
  width: 18%;
  height: 8px;
  right: 15%;
  bottom: 17%;
}

.loading-state--compact .loading-ball-wrap {
  width: 20%;
  right: 14%;
  bottom: 18.5%;
  min-width: 20px;
  max-width: 32px;
}

.loading-copy {
  display: grid;
  gap: var(--loading-copy-gap);
  max-width: min(100%, 560px);
}

.loading-title {
  margin: 0;
  color: var(--loading-title-color);
  font-size: var(--loading-title-size);
  font-weight: 800;
  line-height: 1.12;
  letter-spacing: -0.02em;
  text-wrap: balance;
}

.loading-description {
  margin: 0;
  max-width: min(100%, 520px);
  color: #64748b;
  font-size: var(--loading-description-size);
  line-height: 1.45;
  text-wrap: pretty;
}

@keyframes ballSpin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes ballJump {
  0%,
  100% {
    transform: translate3d(0, 0, 0);
  }
  20% {
    transform: translate3d(20%, -38%, 0);
  }
  40% {
    transform: translate3d(54%, 0, 0);
  }
  62% {
    transform: translate3d(82%, -26%, 0);
  }
  80% {
    transform: translate3d(112%, 0, 0);
  }
}

@keyframes ballShadow {
  0%,
  100% {
    transform: scale(1);
    opacity: 0.62;
  }
  20%,
  62% {
    transform: scale(0.72);
    opacity: 0.38;
  }
}

@supports (width: 1cqw) {
  .loading-state {
    --loading-visual-size: clamp(106px, 40cqw, 196px);
    --loading-min-height: clamp(118px, 52cqw, 196px);
    --loading-title-size: clamp(18px, 7cqw, 30px);
    --loading-description-size: clamp(12px, 3.8cqw, 16px);
  }

  .loading-state--compact {
    --loading-visual-size: clamp(76px, 34cqw, 132px);
    --loading-min-height: clamp(88px, 42cqw, 138px);
    --loading-title-size: clamp(16px, 5.4cqw, 21px);
    --loading-description-size: clamp(11px, 3.4cqw, 13px);
  }
}

@container (max-width: 360px) {
  .loading-state--compact .loading-description {
    display: none;
  }

  .loading-state--compact .loading-copy {
    gap: 4px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .loading-ball-shadow,
  .loading-ball-wrap,
  .loading-ball-art {
    animation: none;
  }
}

@media (max-width: 768px) {
  .loading-state {
    border-radius: 24px;
  }

  .loading-state--compact {
    border-radius: 20px;
  }

  .loading-state--compact .loading-description {
    line-height: 1.35;
  }
}
</style>
