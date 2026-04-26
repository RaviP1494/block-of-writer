import { createMemo, createSignal, For, type Component } from 'solid-js'
import { activeViewSpaceID, focusedEntity, getFlash, getFlickerTSpan, getStream, openFloaters, setFocusedEntity, setOpenFloaters, setWriterTargetID, textWordCount, viewSpaces, writerTargetID, type MultEnt } from '../store';

interface SelectItemProps {
  of: string;
  clickAct: string;
};
export const SelectItem: Component<SelectItemProps> = (props) => {
  const [viewFilter, setViewFilter] = createSignal(0);

  const activeVS = () => viewSpaces.find(vs => vs.id === activeViewSpaceID());

  const collection =
    createMemo(
      () => viewFilter() === 0
        ? activeVS()?.tentsInSpace
        : viewFilter() === 1
          ? activeVS()?.tentsInSpace
            .filter(ent => ent.entityType
              === 'stream')
          : viewFilter() === 2
            ? activeVS()?.tentsInSpace
              .filter(ent => ent.entityType
                !== 'stream')
            : null);

  const handleClick = (ent: MultEnt) => {
    if (ent.entityType === 'stream' && props.clickAct === 'focus') {
      writerTargetID() === ent.refID
        ? setFocusedEntity(ent)
        : setWriterTargetID(ent.refID);
    } else if (props.clickAct === 'focus') {
      focusedEntity() !== ent &&
        setFocusedEntity(ent);
    } else if (props.clickAct === 'multi') {
      !openFloaters.includes(ent) &&
        setOpenFloaters(prev => [...prev, ent]);
    }
    if (focusedEntity() === ent)
      requestAnimationFrame(() => {
        const btnId = ent.entityType + ent.refID.toString();
        const targetBtn = document.getElementById(btnId);

        if (targetBtn) {
          targetBtn.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
  };

  const renderEntBtn = (ent: MultEnt) => {

    if (ent.entityType === 'stream') {
      return (
        <button
          id={'stream' +
            ent.refID.toString()}
          onClick={() => handleClick(ent)}
          classList={{
            ['stream-btn']: true,
            [`focused-stream-btn`]:
              props.clickAct === 'focus' && focusedEntity() === ent,
            [`targeted-stream-btn`]:
              props.clickAct === 'focus' && writerTargetID() === ent.refID,
            [`opened-stream-btn`]:
              props.clickAct === 'multi' && openFloaters.includes(ent)
          }}>
          {getStream(ent.refID)?.title}
        </button>
      );
    } else if (ent.entityType === 'flicker') {
      return (
        <button
          id={'flicker' +
            ent.refID.toString()}
          onClick={() => handleClick(ent)}
          classList={{
            ['flicker-btn']: true,
            [`focused-flicker-btn`]:
              props.clickAct === 'focus' && focusedEntity() === ent,
            [`opened-flicker-btn`]:
              props.clickAct === 'multi' && openFloaters.includes(ent),
          }}>
          {ent.entityType + '(' + getFlickerTSpan(ent.refID).toString() + 'sec)'}
        </button>
      );
    } else if (ent.entityType === 'flash') {
      return (
        <button
          id={'flash' +
            ent.refID.toString()}
          onClick={() => handleClick(ent)}
          classList={{
            ['flash-btn']: true,
            [`focused-flash-btn`]:
              props.clickAct === 'focus' && focusedEntity() === ent,
            [`opened-flash-btn`]:
              props.clickAct === 'multi' && openFloaters.includes(ent),
          }}>
          {ent.entityType + '(' + textWordCount(getFlash(ent.refID)?.textContents || 'many many many words').toString() + 'w)'}
        </button>
      );
    }
  }

  return (
    <div class="lister-box">
    <div class='lister-header'>
    View
      <div class='lister-modes'>
        <button
          onClick={
            () => setViewFilter(1)}>
          Streams</button>
        <button
          onClick={
            () => setViewFilter(0)}>
          All</button>
        <button
          onClick={
            () => setViewFilter(2)}>
          Floaters</button>
      </div>
    </div>
      <div class="lister-list">
        <For each={collection()}>
          {(item) => renderEntBtn(item)}
        </For>
      </div>
    </div>
  );
};
