import { buildWhatsAppAvatar, type WhatsAppAvatarIdentity } from "@/lib/whatsapp/avatar";

/**
 * The customer avatar used everywhere in the console.
 *
 * There is no customer photo to show — the Cloud API does not expose one — so this is
 * always the deterministic fallback. It is one component rather than four inline
 * copies so a person looks the same in the conversation list, the chat header, the
 * contact panel and the contacts table.
 *
 * Deliberately not the Web Growth logo: the logo is the business's identity, and
 * stamping it on a customer's avatar would make every conversation look like a note
 * to ourselves.
 */

const SIZES = {
  sm: "h-8 w-8 text-[0.7rem]",
  md: "h-10 w-10 text-xs",
  lg: "h-16 w-16 text-xl",
} as const;

export default function ContactAvatar({
  identity,
  size = "md",
  className = "",
  /**
   * Avatars sit next to the contact's name almost everywhere, so by default they are
   * decorative and hidden from assistive technology — announcing "VC" straight after
   * "Victor Chinukwue" is just noise. Pass `labelled` where the avatar stands alone.
   */
  labelled = false,
}: {
  identity: WhatsAppAvatarIdentity;
  size?: keyof typeof SIZES;
  className?: string;
  labelled?: boolean;
}) {
  const avatar = buildWhatsAppAvatar(identity);

  return (
    <span
      className={`grid flex-none place-items-center rounded-full font-semibold ${SIZES[size]} ${avatar.tone} ${className}`}
      title={avatar.name}
      {...(labelled ? { role: "img", "aria-label": avatar.name } : { "aria-hidden": "true" })}
    >
      {avatar.initials}
    </span>
  );
}
