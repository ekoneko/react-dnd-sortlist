# React-dnd-sortlist

Quicky build a drag and drop list in react. It bases react-dnd.

# how to use

```tsx
import { createSortList, SortListOwnerProps } from 'react-dnd-sortlist'
const SortList: React.ComponentClass<SortListOwnerProps<ItemProps>> = createSortList<ItemProps>(
  SORT_TYPE,
)
const jsx = (
  <SortList data={arrayData} onSort={handleSort}>
    {(item) => <Item {...item} key={item.id} />}
  </SortList>
)
```
