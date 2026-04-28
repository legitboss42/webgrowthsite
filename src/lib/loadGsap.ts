type GsapBundle = {
  gsap: typeof import("gsap").gsap;
  ScrollTrigger: typeof import("gsap/ScrollTrigger").ScrollTrigger;
};

let gsapBundlePromise: Promise<GsapBundle> | null = null;

export function loadGsap(): Promise<GsapBundle> {
  if (!gsapBundlePromise) {
    gsapBundlePromise = Promise.all([import("gsap"), import("gsap/ScrollTrigger")]).then(
      ([gsapModule, scrollTriggerModule]) => {
        const bundle = {
          gsap: gsapModule.gsap,
          ScrollTrigger: scrollTriggerModule.ScrollTrigger,
        };

        bundle.gsap.registerPlugin(bundle.ScrollTrigger);
        return bundle;
      }
    );
  }

  return gsapBundlePromise;
}
