import { Composition } from 'remotion'
import { UdyoPromo } from './UdyoPromo'
import { UdyoShort } from './UdyoShort'

export const Root = () => (
  <>
    {/* YouTube / website master — 75 sec 1920×1080 */}
    <Composition
      id="UdyoPromo"
      component={UdyoPromo}
      durationInFrames={2250}
      fps={30}
      width={1920}
      height={1080}
    />
    {/* Instagram / Facebook Reel — 30 sec 1080×1920 */}
    <Composition
      id="UdyoShort"
      component={UdyoShort}
      durationInFrames={900}
      fps={30}
      width={1080}
      height={1920}
    />
  </>
)
