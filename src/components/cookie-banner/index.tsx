import Drawer from '@/components/drawer'
import { DrawerCloseButton } from '@/components/drawer/close-button'

export default function CookieBanner() {
  return (
    <Drawer autoOpen>
      <div className="px-6 pb-10 flex flex-col gap-4 max-w-lg mx-auto">
        <h2 className="text-2xl font-bold text-fg">Cookie Notice</h2>

        <div className="flex flex-col gap-3 text-fg/70 text-sm">
          <p>
            I use essential cookies to make this site work. I would also like to use optional
            cookies that help me understand how this site is used and support improvements to
            its experience. These optional cookies will only be set if you choose to allow them.
          </p>
          <p>
            By accepting, you consent to the use of optional cookies. By rejecting, only
            essential cookies will be used.
          </p>
        </div>

        <div className="flex flex-col gap-3 mt-2">
          <DrawerCloseButton className="w-full py-4 rounded-xl bg-bgs text-fg font-bold text-sm cursor-pointer">
            Configure
          </DrawerCloseButton>
          <DrawerCloseButton className="w-full py-4 rounded-xl bg-brand text-white font-bold text-sm cursor-pointer">
            Reject
          </DrawerCloseButton>
          <DrawerCloseButton className="w-full py-4 rounded-xl bg-brand text-white font-bold text-sm cursor-pointer">
            Accept All
          </DrawerCloseButton>
        </div>
      </div>
    </Drawer>
  )
}
