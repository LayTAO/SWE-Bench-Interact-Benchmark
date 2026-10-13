import {
  Button,
  ComboBox,
  Dialog,
  DialogTrigger,
  Heading,
  Input,
  Label,
  ListBox,
  ListBoxItem,
  Modal,
  ModalOverlay,
  Popover
} from 'react-aria-components'

const ITEMS = ['Aardvark', 'Cat', 'Dog', 'Kangaroo', 'Panda', 'Snake'] as const

export function Repro() {
  return (
    <div className="page" id="oracle-ready" data-testid="oracle-ready">
      <DialogTrigger>
        <Button data-testid="open-dialog">Open dialog</Button>
        <ModalOverlay isDismissable data-testid="modal-overlay" className="react-aria-ModalOverlay">
          <Modal className="react-aria-Modal">
            <Dialog className="react-aria-Dialog">
              <Heading slot="title" className="react-aria-Heading">
                ComboBox in a dismissible modal
              </Heading>
              <ComboBox data-testid="repro-combobox" className="react-aria-ComboBox" defaultItems={ITEMS.map((name) => ({id: name, name}))}>
                <Label>Animal</Label>
                <div>
                  <Input data-testid="combobox-input" className="react-aria-Input" />
                  <Button data-testid="combobox-button" className="react-aria-Button">▼</Button>
                </div>
                <Popover className="react-aria-Popover">
                  <ListBox className="react-aria-ListBox">
                    {(item: {id: string; name: string}) => (
                      <ListBoxItem id={item.id} className="react-aria-ListBoxItem">
                        {item.name}
                      </ListBoxItem>
                    )}
                  </ListBox>
                </Popover>
              </ComboBox>
            </Dialog>
          </Modal>
        </ModalOverlay>
      </DialogTrigger>
    </div>
  )
}
