import * as React from 'react';
import ReactDOM from 'react-dom';
import { FluentProvider } from '@fluentui/react-provider';
import { teamsLightTheme } from '@fluentui/react-theme';
import { Tag } from '@fluentui/react-tags';
import { Avatar } from '@fluentui/react-avatar';
import { TagPicker } from '/subject/packages/react-components/react-tag-picker/library/src/components/TagPicker/TagPicker.tsx';
import { TagPickerControl } from '/subject/packages/react-components/react-tag-picker/library/src/components/TagPickerControl/TagPickerControl.tsx';
import { TagPickerGroup } from '/subject/packages/react-components/react-tag-picker/library/src/components/TagPickerGroup/TagPickerGroup.tsx';
import { TagPickerInput } from '/subject/packages/react-components/react-tag-picker/library/src/components/TagPickerInput/TagPickerInput.tsx';
import { TagPickerList } from '/subject/packages/react-components/react-tag-picker/library/src/components/TagPickerList/TagPickerList.tsx';
import { TagPickerOption } from '/subject/packages/react-components/react-tag-picker/library/src/components/TagPickerOption/TagPickerOption.tsx';

const options = [
  'John Doe',
  'Jane Doe',
  'Max Mustermann',
  'Erika Mustermann',
  'Pierre Dupont',
  'Amelie Dupont',
  'Mario Rossi',
  'Maria Rossi',
];

function Reproduction() {
  const [selectedOptions, setSelectedOptions] = React.useState(options);
  return (
    <FluentProvider theme={teamsLightTheme}>
      <main style={{ fontFamily: 'sans-serif', padding: 32, maxWidth: 620 }}>
        <span id="oracle-ready" />
        <h1>TagPicker selected-text Backspace</h1>
        <TagPicker
          selectedOptions={selectedOptions}
          onOptionSelect={(_event, data) => setSelectedOptions(data.selectedOptions)}
        >
          <TagPickerControl data-testid="tag-picker-control">
            <TagPickerGroup data-testid="tag-picker-group">
              {selectedOptions.map((option) => (
                <Tag
                  data-testid={`tag--${option}`}
                  key={option}
                  shape="rounded"
                  media={<Avatar name={option} color="colorful" />}
                  value={option}
                >
                  {option}
                </Tag>
              ))}
            </TagPickerGroup>
            <TagPickerInput data-testid="tag-picker-input" />
          </TagPickerControl>
          <TagPickerList data-testid="tag-picker-list">
            {options
              .filter((option) => !selectedOptions.includes(option))
              .map((option, index) => (
                <TagPickerOption
                  id={`tag-picker-option--${index}`}
                  data-testid={`tag-picker-option--${option}`}
                  value={option}
                  key={option}
                >
                  {option}
                </TagPickerOption>
              ))}
          </TagPickerList>
        </TagPicker>
      </main>
    </FluentProvider>
  );
}

ReactDOM.render(<Reproduction />, document.getElementById('app'));
