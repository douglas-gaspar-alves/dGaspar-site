// Medição GA4 de douglasgaspar.com.
//
// O ID de métricas é público: aparece em todo HTML publicado. A propriedade
// "douglasgaspar.com – GA4" fica na conta Douglas Gaspar
// (properties/310294296) e o fluxo web aponta para https://douglasgaspar.com.
//
// Defina PUBLIC_GA_MEASUREMENT_ID com o valor vazio no build para desligar a
// coleta sem remover o componente (útil em ambientes que não devem reportar).

/** ID de métricas do fluxo web de https://douglasgaspar.com. */
export const DEFAULT_GA_MEASUREMENT_ID = "G-739P03GM5K";

/** ID efetivo: sobrescrito por PUBLIC_GA_MEASUREMENT_ID quando definido. */
export const GA_MEASUREMENT_ID: string =
	import.meta.env.PUBLIC_GA_MEASUREMENT_ID ?? DEFAULT_GA_MEASUREMENT_ID;

// Pixel HubWeb, da conta de anúncios act_876790078666242 (negócio Hub web).
// O ID também é público: o navegador precisa dele para disparar o PageView.
// PUBLIC_META_PIXEL_ID vazio desliga o Pixel sem remover o componente.

/** ID do Pixel HubWeb. */
export const DEFAULT_META_PIXEL_ID = "1470769825003164";

/** ID efetivo: sobrescrito por PUBLIC_META_PIXEL_ID quando definido. */
export const META_PIXEL_ID: string =
	import.meta.env.PUBLIC_META_PIXEL_ID ?? DEFAULT_META_PIXEL_ID;
