import aboutImg from '../assets/images/about_botanical_craft_1794755731252.jpg';
import bevLogoImg from '../assets/images/bev_naturals_logo.png';
import antiItchMistEnhanced from '../assets/images/anti_itch_mist_enhanced_1794760519617.jpg';
import herbsMixImg from '../assets/images/ayurvedic_herbs_mix_mockup_1794759044131.jpg';
import bentoniteClayEnhanced from '../assets/images/bentonite_clay_enhanced_1794760523082.jpg';
import blackShampooEnhanced from '../assets/images/black_shampoo_enhanced_1794760517287.jpg';
import boosterCreamEnhanced from '../assets/images/booster_cream_enhanced_1794760522201.jpg';
import clarifyingShampooEnhanced from '../assets/images/clarifying_shampoo_enhanced_1794760517281.jpg';
import deepTreatmentEnhanced from '../assets/images/deep_treatment_enhanced_1794760519999.jpg';
import dermaRollerEnhanced from '../assets/images/derma_roller_enhanced_1794760515818.jpg';
import growthOilEnhanced from '../assets/images/growth_oil_enhanced_1794760521737.jpg';
import hairButterEnhanced from '../assets/images/hair_butter_enhanced_1794760520413.jpg';
import keratinConditionerEnhanced from '../assets/images/keratin_conditioner_enhanced_1794760518704.jpg';
import kiddiesButterEnhanced from '../assets/images/kiddies_butter_enhanced_1794760525588.jpg';
import kiddiesLeaveInEnhanced from '../assets/images/kiddies_leavein_enhanced_1794760524912.jpg';
import kiddiesOilEnhanced from '../assets/images/kiddies_oil_enhanced_1794760525511.jpg';
import kiddiesRinseOutEnhanced from '../assets/images/kiddies_rinseout_enhanced_1794760524283.jpg';
import kiddiesShampooEnhanced from '../assets/images/kiddies_shampoo_enhanced_1794760522719.jpg';
import leaveInEnhanced from '../assets/images/leave_in_enhanced_1794760519265.jpg';
import scalpBalmEnhanced from '../assets/images/scalp_balm_enhanced_1794760522893.jpg';
import tempColorsImg from '../assets/images/temporary_hair_colors_mockup_1794759043962.jpg';
import type { Product } from './types';

export const PRODUCT_IMAGES = {
  about: aboutImg,
  logo: bevLogoImg,
  herbsMix: herbsMixImg,
  tempColors: tempColorsImg,
  dermaRoller: dermaRollerEnhanced,
};

const BUNDLED_PRODUCT_IMAGES: Record<string, string> = {
  'bn-adult-clarifying-shampoo': clarifyingShampooEnhanced,
  'bn-adult-black-shampoo': blackShampooEnhanced,
  'bn-adult-keratin-repair': keratinConditionerEnhanced,
  'bn-adult-deep-conditioning': deepTreatmentEnhanced,
  'bn-adult-hair-mist': antiItchMistEnhanced,
  'bn-adult-leave-in': leaveInEnhanced,
  'bn-adult-hair-butter': hairButterEnhanced,
  'bn-adult-growth-oil': growthOilEnhanced,
  'bn-adult-booster-cream': boosterCreamEnhanced,
  'bn-adult-hair-balm': scalpBalmEnhanced,
  'bn-adult-bentonite-clay': bentoniteClayEnhanced,
  'bn-adult-herbs-mix': herbsMixImg,
  'bn-adult-temp-colors': tempColorsImg,
  'bn-adult-derma-roller': dermaRollerEnhanced,
  'bn-kiddies-shampoo': kiddiesShampooEnhanced,
  'bn-kiddies-leave-in': kiddiesLeaveInEnhanced,
  'bn-kiddies-rinse-out': kiddiesRinseOutEnhanced,
  'bn-kiddies-butter': kiddiesButterEnhanced,
  'bn-kiddies-growth-oil': kiddiesOilEnhanced,
  'bn-combo-complete-kiddies-set': kiddiesShampooEnhanced,
};

export function resolveProductImage(product: Pick<Product, 'id' | 'imageSrc'>): string {
  return BUNDLED_PRODUCT_IMAGES[product.id] || product.imageSrc;
}
