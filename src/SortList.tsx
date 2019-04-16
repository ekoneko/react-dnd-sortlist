import * as React from 'react'
import {
  DragSource,
  DropTarget,
  DragSourceSpec,
  DropTargetSpec,
  DragSourceCollector,
  DropTargetCollector,
  DropTargetMonitor,
} from 'react-dnd'
import classnames from 'classnames'
import { compose } from 'recompose'
import { findDOMNode } from 'react-dom'

interface SortContainerProps<Props> {
  index: number
  children: React.ReactNode
  sort: (dragIndex: number, hoverIndex: number, dragOriginIndex: number) => void
  props: Props
  onSave: () => void
  disable?: boolean
  className?: string
  draggingClassName?: string
}

interface SortContainerConnectProps {
  connectDragSource: Function
  connectDropTarget: Function
  dragging: boolean
}

export interface SortListState {
  sort: string[]
  lastDragIndex: number
  lastHoverIndex: number
}

export interface SortListOwnerProps<Props> {
  data: Props[]
  onSort: (dragIndex: number, hoverIndex: number) => void
  children: (props: Props, index: number) => React.ReactElement<any>
  disable?: boolean
  handler?: React.ComponentClass<{}> | React.SFC<{}>
  classNames?: string
  draggingClassName?: string
}

class SortContainer<Props> extends React.PureComponent<
  SortContainerProps<Props> & SortContainerConnectProps,
  {}
> {
  render() {
    const {
      connectDropTarget,
      connectDragSource,
      dragging,
      disable,
      className = '',
      draggingClassName = '',
    } = this.props
    return connectDropTarget(
      connectDragSource(
        <div
          className={classnames({
            [className]: true,
            [draggingClassName]: dragging,
          })}
          style={{
            opacity: dragging ? 0 : 1,
            userSelect: disable ? 'inherit' : 'none',
          }}
        >
          {this.props.children}
        </div>,
      ),
    )
  }
}

function createSourceSpec<Props>(): DragSourceSpec<
  Props & SortContainerProps<Props>,
  Partial<SortContainerProps<Props>>
> {
  return {
    beginDrag(props) {
      // Should return a new object
      // https://github.com/react-dnd/react-dnd/issues/1112
      return {
        index: props.index,
        originIndex: props.index,
      }
    },
    canDrag(props) {
      return !props.disable
    },
  }
}

const sourceCollect: DragSourceCollector<Partial<SortContainerConnectProps>> = (
  connect,
  monitor,
) => {
  return {
    connectDragSource: connect.dragSource(),
    dragging: monitor.isDragging(),
  }
}

function hover<Props>(
  props: Props & SortContainerProps<Props>,
  monitor: DropTargetMonitor,
  component: React.ReactInstance,
) {
  if (!component) {
    return
  }
  const dragItem = monitor.getItem()
  if (!dragItem) {
    return
  }
  const dragIndex = dragItem.index
  const dragOriginIndex = dragItem.originIndex
  const hoverIndex = props.index
  if (dragIndex === hoverIndex) {
    return
  }
  const hoverBoundingRect = (findDOMNode(component) as Element).getBoundingClientRect()
  const clientOffset = monitor.getClientOffset()!

  if (
    hoverIndex < dragItem.index &&
    clientOffset.y > hoverBoundingRect.top + hoverBoundingRect.height / 4
  ) {
    return
  } else if (
    hoverIndex > dragItem.index &&
    clientOffset.y < hoverBoundingRect.bottom - hoverBoundingRect.height / 4
  ) {
    return
  }
  props.sort(dragIndex, hoverIndex, dragOriginIndex)
  monitor.getItem().index = hoverIndex
}

function createTargetSpec<Props>(): DropTargetSpec<Props & SortContainerProps<Props>> {
  return {
    hover: hover,
    drop(props) {
      props.onSave()
    },
  }
}

const targetConnect: DropTargetCollector<Partial<SortContainerConnectProps>> = (
  connect,
  monitor,
) => {
  return {
    connectDropTarget: connect.dropTarget(),
  }
}
/**
 *
 * @param type ReactDND sourceType / targetType
 * @param uniqFieldName React Array List 需要一个唯一 key 做优化,
 *  uniqFieldName 用于标识数据中可以用来视为唯一 key 的字段名
 */
export function createSortList<Props = any>(type: string | symbol, uniqFieldName = 'id') {
  const sourceSpec = createSourceSpec<Props>()
  const targetSpec = createTargetSpec<Props>()
  const WrappedSortContainer = compose<
    SortContainerProps<Props> & SortContainerConnectProps,
    SortContainerProps<Props>
  >(
    DropTarget(type, targetSpec, targetConnect),
    DragSource(type, sourceSpec, sourceCollect),
  )(SortContainer as {
    new (): SortContainer<Props>
  })

  return class SortList extends React.PureComponent<SortListOwnerProps<Props>, SortListState> {
    constructor(props: SortListOwnerProps<Props>) {
      super(props)
      this.state = {
        sort: Object.keys(props.data),
        lastDragIndex: -1,
        lastHoverIndex: -1,
      }
    }
    static getDerivedStateFromProps(nextProps: SortListOwnerProps<Props>, state: SortListState) {
      if (nextProps.data.length !== state.sort.length) {
        return {
          sort: Object.keys(nextProps.data),
        }
      }
      return null
    }

    public sort = (dragIndex: number, hoverIndex: number, dragOriginIndex: number) => {
      const { sort } = this.state
      const nextSort = [...sort]
      nextSort.splice(hoverIndex, 0, nextSort.splice(dragIndex, 1)[0])
      this.setState({
        sort: nextSort,
        lastDragIndex: dragOriginIndex,
        lastHoverIndex: hoverIndex,
      })
    }

    public render() {
      const { data } = this.props
      const { sort } = this.state

      return (
        <div>
          {sort.map((i) => {
            const index = +i
            const item = data[index]
            return (
              <WrappedSortContainer
                key={(item as any)[uniqFieldName]}
                props={item}
                index={index}
                sort={this.sort}
                disable={this.props.disable}
                onSave={this.handleSaveSort}
                className={this.props.classNames}
                draggingClassName={this.props.draggingClassName}
              >
                {this.props.children(item, index)}
              </WrappedSortContainer>
            )
          })}
        </div>
      )
    }

    public handleSaveSort = () => {
      const { lastDragIndex, lastHoverIndex } = this.state
      this.props.onSort(lastDragIndex, lastHoverIndex)
      this.setState({
        lastDragIndex: -1,
        lastHoverIndex: -1,
        sort: Object.keys(this.props.data),
      })
    }
  }
}
