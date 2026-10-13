import { Component, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import {
  NzCascaderComponent,
  NzCascaderModule,
  NzCascaderOption
} from '@subject-cascader';

const options: NzCascaderOption[] = [
  {
    value: 'zhejiang',
    label: 'Zhejiang',
    children: [
      {
        value: 'hangzhou',
        label: 'Hangzhou',
        children: [
          {
            value: 'xihu',
            label: 'West Lake',
            isLeaf: true
          }
        ]
      },
      {
        value: 'ningbo',
        label: 'Ningbo',
        isLeaf: true
      }
    ]
  },
  {
    value: 'jiangsu',
    label: 'Jiangsu',
    children: [
      {
        value: 'nanjing',
        label: 'Nanjing',
        children: [
          {
            value: 'zhonghuamen',
            label: 'Zhong Hua Men',
            isLeaf: true
          }
        ]
      }
    ]
  }
];

@Component({
  selector: 'oracle-root',
  standalone: true,
  imports: [FormsModule, NzCascaderModule],
  template: `
    <main style="padding: 32px; width: 620px">
      <span id="oracle-ready"></span>
      <h1>Cascader cancel-collapse</h1>
      <nz-cascader
        #cascader
        data-testid="cascader"
        [nzOptions]="options"
        [(ngModel)]="values"
      ></nz-cascader>
      <button type="button" (click)="snapshotColumns()">Snapshot columns</button>
      <output id="retained-columns">{{ retainedColumns }}</output>
    </main>
  `
})
class OracleComponent {
  @ViewChild('cascader', { static: true }) cascader!: NzCascaderComponent;
  options = options;
  values: string[] | null = null;
  retainedColumns = -1;

  snapshotColumns(): void {
    this.retainedColumns = this.cascader.cascaderService.columns.length;
  }
}

bootstrapApplication(OracleComponent, {
  providers: [provideNoopAnimations()]
}).catch(error => console.error(error));
