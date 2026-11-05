const CLOSE_GRACE_MS = 1500;
const MAX_OPEN_MS = 120_000;

let pickerOpen = false;
let graceTimer: ReturnType<typeof setTimeout> | null = null;
let maxOpenTimer: ReturnType<typeof setTimeout> | null = null;

export function isFilePickerOpen(): boolean {
  return pickerOpen;
}

function isFileInput(target: EventTarget | null): boolean {
  return target instanceof HTMLInputElement && target.type === 'file';
}

function openPicker() {
  pickerOpen = true;
  if (graceTimer) clearTimeout(graceTimer);
  if (maxOpenTimer) clearTimeout(maxOpenTimer);
  maxOpenTimer = setTimeout(closePicker, MAX_OPEN_MS);
}

function closePicker() {
  if (maxOpenTimer) clearTimeout(maxOpenTimer);
  maxOpenTimer = null;
  if (graceTimer) clearTimeout(graceTimer);
  // Browsers fire focus/visibility events after the dialog closes; keep the guard up briefly.
  graceTimer = setTimeout(() => {
    pickerOpen = false;
    graceTimer = null;
  }, CLOSE_GRACE_MS);
}

export function installFilePickerGuard(): () => void {
  const onClick = (e: Event) => {
    if (isFileInput(e.target)) openPicker();
  };
  const onClose = (e: Event) => {
    if (isFileInput(e.target)) closePicker();
  };

  document.addEventListener('click', onClick, true);
  document.addEventListener('change', onClose, true);
  document.addEventListener('cancel', onClose, true);

  return () => {
    document.removeEventListener('click', onClick, true);
    document.removeEventListener('change', onClose, true);
    document.removeEventListener('cancel', onClose, true);
    if (graceTimer) clearTimeout(graceTimer);
    if (maxOpenTimer) clearTimeout(maxOpenTimer);
    pickerOpen = false;
  };
}
