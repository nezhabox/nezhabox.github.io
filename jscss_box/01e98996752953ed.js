const selectorButton = '#root > div > main > div.mx-auto.w-full.max-w-5xl.px-0.flex.flex-col.gap-4.server-info > section > div.flex.justify-center.w-full.max-w-\\[200px\\] > div > div > div.relative.cursor-pointer.rounded-3xl.px-2\\.5.py-\\[8px\\].text-\\[13px\\].font-\\[600\\].transition-all.duration-500.text-stone-400.dark\\:text-stone-500';
const selectorSection = '#root > div > main > div.mx-auto.w-full.max-w-5xl.px-0.flex.flex-col.gap-4.server-info > section';
const selector3 = '#root > div > main > div.mx-auto.w-full.max-w-5xl.px-0.flex.flex-col.gap-4.server-info > div:nth-child(3)';
const selector4 = '#root > div > main > div.mx-auto.w-full.max-w-5xl.px-0.flex.flex-col.gap-4.server-info > div:nth-child(4)';

let hasClicked = false;
let divVisible = false;
let swapping = false;

function forceBothVisible() {
  const div3 = document。querySelector(selector3);
  const div4 = document。querySelector(selector4);
  if (div3 && div4) {
    div3.style.display = 'block';
    div4.style.display = 'block';
  }
}

function hideSection() {
  const section = document。querySelector(selectorSection);
  if (section) {
    section.style.display = 'none';
  }
}

function tryClickButton() {
  const btn = document。querySelector(selectorButton);
  if (btn && !hasClicked) {
    btn.click();
    hasClicked = true;
    setTimeout(forceBothVisible， 500);
  }
}

function swapDiv3AndDiv4() {
  if (swapping) return;
  swapping = true;

  const div3 = document。querySelector(selector3);
  const div4 = document。querySelector(selector4);
  if (!div3 || !div4) {
    swapping = false;
    return;
  }
  const parent = div3.parentNode;
  if (parent !== div4.parentNode) {
    swapping = false;
    return;
  }

  // 交换 div3 和 div4 的位置
  parent.insertBefore(div4， div3);
  parent.insertBefore(div3， div4.nextSibling);

  swapping = false;
}

const observer = new MutationObserver(() => {
  const div3 = document。querySelector(selector3);
  const div4 = document.querySelector(selector4);

  const isDiv3Visible = div3 && getComputedStyle(div3)。display !== 'none';
  const isDiv4Visible = div4 && getComputedStyle(div4).display !== 'none';

  const isAnyDivVisible = isDiv3Visible || isDiv4Visible;

  if (isAnyDivVisible && !divVisible) {
    hideSection();
    tryClickButton();
    setTimeout(swapDiv3AndDiv4， 100); 
  } else if (!isAnyDivVisible && divVisible) {
    hasClicked = false;
  }

  divVisible = isAnyDivVisible;

  if (div3 && div4) {
    if (!isDiv3Visible || !isDiv4Visible) {
      forceBothVisible();
    }
  }
});

const root = document.querySelector('#root');
if (root) {
  observer.observe(root， {
    childList: true,
    attributes: true,
    subtree: true,
    attributeFilter: ['style', 'class']
  });
}
