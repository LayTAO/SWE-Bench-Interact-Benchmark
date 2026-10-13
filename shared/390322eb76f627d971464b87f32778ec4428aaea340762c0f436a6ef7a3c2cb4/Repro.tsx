import {
  Button,
  ComboBox,
  Header,
  Input,
  Label,
  ListBox,
  ListBoxItem,
  ListBoxSection,
  Popover
} from 'react-aria-components'

export function Repro() {
  return (
    <div className="page">
      <ComboBox data-testid="repro-combobox" className="react-aria-ComboBox">
        <Label>Preferred fruit or vegetable</Label>
        <div>
          <Input data-testid="combobox-input" className="react-aria-Input" />
          <Button data-testid="combobox-button" className="react-aria-Button">▼</Button>
        </div>
        <Popover className="react-aria-Popover">
          <ListBox className="react-aria-ListBox">
            <ListBoxSection>
              <Header data-testid="section-header-fruit" className="react-aria-Header">Fruit</Header>
              <ListBoxItem id="Apple">Apple</ListBoxItem>
              <ListBoxItem id="Banana">Banana</ListBoxItem>
            </ListBoxSection>
            <ListBoxSection>
              <Header data-testid="section-header-vegetable" className="react-aria-Header">Vegetable</Header>
              <ListBoxItem id="Cabbage">Cabbage</ListBoxItem>
              <ListBoxItem id="Broccoli">Broccoli</ListBoxItem>
            </ListBoxSection>
          </ListBox>
        </Popover>
      </ComboBox>
    </div>
  )
}
