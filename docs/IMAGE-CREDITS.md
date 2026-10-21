# Separate travel images

This edition replaces all five small collage crops with the five separate Gemini-generated images provided by the user. Originals are preserved in frontend/image-originals and copied unchanged to public/images/<key>/original.jpg. These are AI-generated illustrative travel scenes, not verified operator photographs.

| Key | Supplied image suffix | Placement |
| --- | --- | --- |
| hero | opmlryopmlryopml | Home coastal bus image; links to route search |
| auth | 9rjfx79rjfx79rjf | Sign-in and homepage passenger story |
| driver | g0q6l1g0q6l1g0q6 | About and homepage driver story |
| network | ev9vwgev9vwgev9v | Homepage station story |
| service | wyooicwyooicwyoo | Contact ticket-counter image |

`npm run images:travel` regenerates responsive AVIF, WebP and JPEG variants at 640, 960, 1280 and original width, excluding dimensions larger than the supplied source. Images are not upscaled. JPEG and WebP use quality 94; AVIF uses quality 80. The image manifest records the actual source dimensions. The source originals are provided so image quality is not lost between editions.

The coastal image includes an embedded Book Now label from the supplied original. The complete hero image is a keyboard-accessible route-search link. Face positioning is adjusted for narrow image containers. Light mode remains the default.

The older collage-splitting script is retained only as historical tooling; it is not used by this edition. Do not run it to rebuild the separate images. The original 4K photography pipeline remains optional; these supplied images are not claimed to be 4K.

## Destination photographs

Each destination card now selects a different local photograph by city name. Unknown destinations use a labeled landscape illustration. The user-provided comparison image was used as a layout reference, not sliced into low-resolution card assets.

| Destination | Source photograph | Photographer | License |
| --- | --- | --- | --- |
| Colombo | [Colombo city skyline at night.png](https://commons.wikimedia.org/wiki/File:Colombo_city_skyline_at_night.png) | Gihanud2001 | [CC0](http://creativecommons.org/publicdomain/zero/1.0/deed.en) |
| Anuradhapura | [SL Anuradhapura asv2020-01 img11 Ruwanwelisaya Stupa.jpg](https://commons.wikimedia.org/wiki/File:SL_Anuradhapura_asv2020-01_img11_Ruwanwelisaya_Stupa.jpg) | A.Savin | [FAL](https://artlibre.org/licence/lal/en) |
| Badulla | [Dunhinda.jpg](https://commons.wikimedia.org/wiki/File:Dunhinda.jpg) | Srlnkn at English Wikipedia | [Public domain](https://commons.wikimedia.org/wiki/File:Dunhinda.jpg) |
| Ella | [The Nine Arches Bridge.jpg](https://commons.wikimedia.org/wiki/File:The_Nine_Arches_Bridge.jpg) | MichaelJames2468 | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| Galle | [SL Galle Fort asv2020-01 img24.jpg](https://commons.wikimedia.org/wiki/File:SL_Galle_Fort_asv2020-01_img24.jpg) | A.Savin | [FAL](https://artlibre.org/licence/lal/en) |
| Jaffna | [Nallur Kandasamy front entrance.jpg](https://commons.wikimedia.org/wiki/File:Nallur_Kandasamy_front_entrance.jpg) | Gane Kumaraswamy | [CC BY-SA 2.0](https://creativecommons.org/licenses/by-sa/2.0) |
| Kandy | [SL Kandy asv2020-01 img33 Sacred Tooth Temple.jpg](https://commons.wikimedia.org/wiki/File:SL_Kandy_asv2020-01_img33_Sacred_Tooth_Temple.jpg) | A.Savin | [FAL](https://artlibre.org/licence/lal/en) |
| Matara | [Sri Lanka Photo197.jpg](https://commons.wikimedia.org/wiki/File:Sri_Lanka_Photo197.jpg) | psychoslave | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| Nuwara Eliya | [NuwaraEliya from top.jpg](https://commons.wikimedia.org/wiki/File:NuwaraEliya_from_top.jpg) | Abdul malik77 | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| Trincomalee | [Spiritual 16.jpg](https://commons.wikimedia.org/wiki/File:Spiritual_16.jpg) | Shamli071 | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0) |

Images are resized/re-encoded and cropped by the card viewport. All photo variants retain the source license. Attribution is also available through the destination section’s Photographers & licenses link (`public/images/destination-credits.html`). Full source metadata is preserved in `image-originals/travel-sources.json`.

Run `npm run images:travel -- destination-` to rebuild only destination photos, or `npm run images:travel` for all image sets. Destination responsive widths are 480, 800 and the source width (up to 1280 pixels), with no upscaling. Destination WebP/JPEG variants use quality 86, and AVIF uses quality 65. Downloaded source images are preserved unchanged.
