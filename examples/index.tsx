import * as React from 'react'
import { render } from 'react-dom'
import { DragDropContextProvider } from 'react-dnd'
import HTML5Backend from 'react-dnd-html5-backend'
import { createSortList, SortListOwnerProps } from '../src/index'

const SORT_TYPE = 'example_sort_type'

interface ListItemProps {
  id: string
  name: string
}

interface AppState {
  data: ListItemProps[]
}

const Item: React.SFC<ListItemProps> = (props: ListItemProps) => {
  return <div className="item">{props.name}</div>
}

class Example extends React.Component<{}, AppState> {
  SortList: React.ComponentClass<SortListOwnerProps<ListItemProps>>
  state = {
    data: [
      { id: '1', name: 'aaa' },
      { id: '2', name: 'bbb' },
      { id: '3', name: 'ccc' },
      { id: '4', name: 'ddd' },
    ],
  }
  constructor(props) {
    super(props)
    this.SortList = createSortList<ListItemProps>(SORT_TYPE)
  }
  render() {
    const { SortList } = this
    const { data } = this.state
    return (
      <div>
        <SortList data={data} onSort={this.handleSort}>
          {(item) => <Item {...item} key={item.id} />}
        </SortList>
      </div>
    )
  }

  private handleSort = (dragIndex: number, hoverIndex: number) => {
    const { data } = this.state
    const nextData = [...data]
    nextData.splice(hoverIndex, 0, nextData.splice(dragIndex, 1)[0])
    this.setState({ data: nextData })
  }
}

render(
  <DragDropContextProvider backend={HTML5Backend}>
    <Example />
  </DragDropContextProvider>,
  document.getElementById('root'),
)
