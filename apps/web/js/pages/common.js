
import { menuBoot, qs } from '../lib/utils.js';
import { isDemoMode, getModeBannerText } from '../services/public-api.js';

menuBoot();
const banner = qs('#modeBanner');
if (banner && isDemoMode()) {
  banner.textContent = getModeBannerText();
  banner.classList.remove('hidden');
}
