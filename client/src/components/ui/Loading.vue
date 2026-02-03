<style scoped>
  .loader {
    --size: 100px;
    --duration: 2s;
    --logo-color: grey;
    --background: linear-gradient(
      0deg,
      rgba(50, 50, 50, 0.2) 0%,
      rgba(100, 100, 100, 0.2) 100%
    );
    height: var(--size);
    aspect-ratio: 1;
    position: relative;
  }

  .loader .box {
    position: absolute;
    background: rgba(100, 100, 100, 0.15);
    background: var(--background);
    border-radius: 50%;
    border-top: 1px solid rgba(100, 100, 100, 1);
    box-shadow: rgba(0, 0, 0, 0.3) 0px 10px 10px -0px;
    backdrop-filter: blur(5px);
    animation: ripple var(--duration) infinite ease-in-out;
  }

  .loader .box:nth-child(1) {
    inset: 40%;
    z-index: 99;
  }

  .loader .box:nth-child(2) {
    inset: 30%;
    z-index: 98;
    border-color: rgba(100, 100, 100, 0.8);
    animation-delay: 0.2s;
  }

  .loader .box:nth-child(3) {
    inset: 20%;
    z-index: 97;
    border-color: rgba(100, 100, 100, 0.6);
    animation-delay: 0.4s;
  }

  .loader .box:nth-child(4) {
    inset: 10%;
    z-index: 96;
    border-color: rgba(100, 100, 100, 0.4);
    animation-delay: 0.6s;
  }

  .loader .box:nth-child(5) {
    inset: 0%;
    z-index: 95;
    border-color: rgba(100, 100, 100, 0.2);
    animation-delay: 0.8s;
  }

  .loader .logo {
    position: absolute;
    inset: 0;
    display: grid;
    place-content: center;
    padding: 25%;
  }

  .loader .logo svg {
    fill: var(--logo-color);
    width: 100%;
    animation: color-change var(--duration) infinite ease-in-out;
  }

  @keyframes ripple {
    0% {
      transform: scale(1);
      box-shadow: rgba(0, 0, 0, 0.3) 0px 10px 10px -0px;
    }
    50% {
      transform: scale(1.3);
      box-shadow: rgba(0, 0, 0, 0.3) 0px 30px 20px -0px;
    }
    100% {
      transform: scale(1);
      box-shadow: rgba(0, 0, 0, 0.3) 0px 10px 10px -0px;
    }
  }

  @keyframes color-change {
    0% {
      fill: var(--logo-color);
    }
    50% {
      fill: white;
    }
    100% {
      fill: var(--logo-color);
    }
  }
</style>

<template>
  <div class="loader">
    <div class="box">
      <div class="logo">
        <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="50.000057220458984" height="50" viewBox="0 0 50.000057220458984 50" fill="none"><path fill-rule="evenodd" style="mix-blend-mode:normal" d="M39.9963 4.99988L39.9963 4.99987C39.9963 2.2387 42.2347 0.000328064 44.9959 0.000328064L44.9959 0.000328064C47.7571 0.000328064 49.9954 2.2387 49.9954 4.99987L49.9954 4.99988C49.9954 7.76104 47.7571 9.99942 44.9959 9.99942L44.9959 9.99942C42.2347 9.99942 39.9963 7.76104 39.9963 4.99988ZM29.9973 4.99987C29.9973 7.76104 27.7589 9.99942 24.9977 9.99942L24.9977 9.99942C16.7656 9.99942 10.0568 16.6697 9.99908 24.8891C9.99908 24.9254 9.99908 24.9617 9.99908 24.998C9.99908 33.2665 16.7292 39.9988 24.9977 39.9988C26.4704 39.9988 27.8944 39.7853 29.2402 39.3875C35.8557 37.4323 31.8961 29.9997 24.9977 29.9997L24.9977 29.9997C22.248 29.9997 19.9982 27.7499 19.9982 25.0002C19.9982 22.2504 22.248 20.0006 24.9977 20.0006L44.998 20.0006C47.7592 20.0006 49.9976 22.239 49.9976 25.0002L49.9976 25.0002C49.9976 38.7874 38.787 50 24.9977 50C11.2084 50 0.0747798 38.8643 6.70319e-07 25.1433L6.74123e-07 25.0023C1.04593e-06 11.2151 11.2105 0.00460434 24.9977 0.00460434L29.993 0.00460434C29.9953 0.00460434 29.9973 0.00268936 29.9973 0.000328064L29.9973 0.000328064L29.9973 4.99987Z"></path></svg>
      </div>
    </div>
    <div class="box"></div>
    <div class="box"></div>
    <div class="box"></div>
    <div class="box"></div>
  </div>
</template>
