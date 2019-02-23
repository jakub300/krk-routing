let idValue = 0;

export default function id() {
  if (process.env.VUE_APP_IN_APP) {
    return 0;
  }

  idValue += 1;
  return idValue;
}
