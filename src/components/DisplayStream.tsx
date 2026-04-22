import { type Component, createMemo, createSignal, Show, For, Match, Switch } from 'solid-js';
import { EditTitle } from './EditTitle';
import {
  allStreams, updateStreamTitle,
  groupedFlashIDs,
  deleteStream,
  chainAttStreamIDs,
  setChainAttStreamIDs
} from '../store';
import { DisplayFlash } from './DisplayFlash';

export interface DisplayStreamProps {
  id: number;
  innerClickMode?: string;
}

export const DisplayStream: Component<DisplayStreamProps> = (props) => {
  const [streamBG, setStreamBG] = createSignal(true);
  const [deleteClicked, setDeleteClicked] = createSignal(false);
  const [flashSpacing, setFlashSpacing] = createSignal(false);
  const [showTimes, setShowTimes] = createSignal(false);
  const [flowUp, setFlowUp] = createSignal(false);
  const [isEditingTitle, setIsEditingTitle] = createSignal(false);

  const stream = () => allStreams.find((stream) => stream.id === props.id);

  const groupedContent = createMemo(() => {
    let groups = [...groupedFlashIDs(props.id)];
    if (flowUp()) {
      groups.reverse();
      groups = groups.map(group => {
        if (flashSpacing()) {
          return { ...group, flashIDs: [...group.flashIDs].reverse() };
        }
        return group;
      });
    }
    return groups;
  });

  return (
    <Show when={stream()}>
      <div class={streamBG() ? 'stream-box white-bg' : 'stream-box parchment-bg'}>
        <div class='stream-title'>
          <Show when={!isEditingTitle()}
            fallback={
              <EditTitle
                initialValue={stream()!.title}
                onSave={(title: string) => {
                  updateStreamTitle(stream()!.id, title);
                  setIsEditingTitle(false);
                }}
                onCancel={() => setIsEditingTitle(false)} />
            }>

            <div
              class='flex-top-down'
              onClick={(e) => console.log(e)}
              style={{
                position: 'relative'
              }}>
              <h1>
                {stream()?.title}
              </h1>

              <div class='tiny-fun flex-wide'>
                <button
                  onClick={() => setStreamBG(p => !p)}
                >
                  ⬚
                </button>
                <button
                  class={flowUp() ? 'anim-flip-on' : 'anim-flip-off'}
                  onClick={() => {
                    setFlowUp(!flowUp())
                    setShowTimes(false)
                  }}>
                  🡇
                </button>
                <button
                  class={
                    showTimes() ? 'anim-spacing inactivated'
                      : flashSpacing() ? 'anim-spacing' : 'anim-spacing-off'}
                  onClick={() =>
                    setFlashSpacing(!flashSpacing())}>
                  ⟣⟢
                </button>
                <button
                  class={flowUp() ? 'anim-flip-off inactivated'
                    : showTimes() ? 'anim-flip-on' : 'anim-flip-off'}
                  onClick={() => {
                    setFlashSpacing(true)
                    setShowTimes(!showTimes())
                  }}>
                  ⏲
                </button>
              </div>

              <Switch>
                <Match when={props.innerClickMode === 'focus'}>
                  <div onMouseLeave={() => setDeleteClicked(false)}
                    class='display-top-box'
                    style={{
                      border: deleteClicked() ? '1px dashed #003004' : 'none',
                      transition: 'border 0.5s ease'
                    }}>
                    <button style={{ position: 'absolute', left: '0px' }}
                      class='transparent'
                      onClick={() => setIsEditingTitle(true)}>
                      Rename
                    </button>

                    <button class={deleteClicked()
                      ? 'delete-reveal' : 'delete-hide'}
                      onClick={() =>
                        deleteClicked()
                          ? deleteStream(stream()!.id)
                          && setDeleteClicked(false)
                          : ''}
                    >
                      Confirm?
                    </button>
                    <button
                      onClick={() => setDeleteClicked(true)}
                      class={deleteClicked() ?
                        'delete-hide' : 'delete-reveal'}>
                      X
                    </button>
                  </div>
                </Match>
                <Match when={props.innerClickMode === 'chain'}>
                  <div class='display-top-box'>
                    <button
                      onClick={() => setChainAttStreamIDs(() => chainAttStreamIDs.filter(id => id !== stream()?.id))}
                      class='delete-reveal'>
                      -
                    </button>
                  </div>
                </Match>
              </Switch>
            </div>
          </Show>
        </div>
        <div class='stream-text'>
          <For each={groupedContent()}>
            {(group) => (
              <div
                class={
                  flashSpacing() ?
                    'flicker' :
                    'paragraph flicker'
                }>
                <For each={group.flashIDs}>
                  {(flashID, index) => {
                    const prevID = index() > 0 ? group.flashIDs[index() - 1] : null;
                    return <DisplayFlash id={flashID}
                      prevID={prevID}
                      showTimes={() => showTimes()}
                      isSpaced={() => flashSpacing()}
                      clickDo={props.innerClickMode} />;
                  }}
                </For>
              </div>
            )}
          </For>
        </div>
      </div>
    </Show>
  );
};


