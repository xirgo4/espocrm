/************************************************************************
 * This file is part of EspoCRM.
 *
 * EspoCRM - Open Source CRM application.
 * Copyright (C) 2014-2021 Yurii Kuznietsov, Taras Machyshyn, Oleksii Avramenko
 * Website: https://www.espocrm.com
 *
 * EspoCRM is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * EspoCRM is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with EspoCRM. If not, see http://www.gnu.org/licenses/.
 *
 * The interactive user interfaces in modified source and object code versions
 * of this program must display Appropriate Legal Notices, as required under
 * Section 5 of the GNU General Public License version 3.
 *
 * In accordance with Section 7(b) of the GNU General Public License version 3,
 * these Appropriate Legal Notices must retain the display of the "EspoCRM" word.
 ************************************************************************/

define('views/export/modals/idle', ['views/modal', 'model'], function (Dep, Model) {

    return Dep.extend({

        className: 'dialog dialog-record',

        template: 'export/modals/idle',

        checkInterval: 4000,

        data: function () {
            return {
                infoText: this.translate('infoText', 'messages', 'Export'),
            };
        },

        events: {
            'click [data-action="download"]': function () {
                this.actionDownload();
            },
        },

        setup: function () {
            this.action = this.options.action;
            this.id = this.options.id;
            this.status = 'Pending';

            this.headerHtml = this.getHelper().escapeString(
                this.translate('Export')
            );

            this.model = new Model();
            this.model.name = 'Export';

            this.model.setDefs({
                fields: {
                    'status': {
                        type: 'enum',
                        readOnly: true,
                        options: [
                            'Pending',
                            'Running',
                            'Success',
                            'Failed',
                        ],
                        style: {
                            'Success': 'success',
                            'Failed': 'danger',
                        },
                    },
                    'attachmentId': {
                        type: 'varchar',
                    },
                }
            });

            this.model.set({
                status: this.status,
                processedCount: null,
            });

            this.createView('record', 'views/record/edit-for-modal', {
                scope: 'None',
                model: this.model,
                el: this.getSelector() + ' .record',
                detailLayout: [
                    {
                        rows: [
                            [
                                {
                                    name: 'status',
                                    labelText: this.translate('status', 'fields', 'Export'),
                                }
                            ]
                        ]
                    }
                ],
            });

            this.on('close', () => {
                if (this.model.get('status') !== 'Pending') {
                    return;
                }

                Espo.Ajax.postRequest('Export/action/subscribeToNotificationOnSuccess', {
                    id: this.id,
                });
            });

            this.checkStatus();
        },

        checkStatus: function () {
            Espo.Ajax
                .getRequest('Export/action/status', {
                    id: this.id,
                })
                .then(response => {
                    let status = response.status;

                    if (status === 'Pending') {
                        setTimeout(() => this.checkStatus(), this.checkInterval);

                        return;
                    }

                    this.model.set({
                        status: response.status,
                        attachmentId: response.attachmentId,
                    });

                    if (status === 'Success') {
                        this.trigger('success', {
                            attachmentId: response.attachmentId,
                        });

                        this.showDownload();
                    }

                    if (this.$el) {
                        this.$el.find('.info-text').addClass('hidden');
                    }
                });
        },

        showDownload: function () {
            this.$el.find('.download-container').removeClass('hidden');

            let $download = this.$el.find('[data-action="download"]');

            $download.removeClass('hidden');
        },

        actionDownload: function () {
            this.trigger('download', this.model.get('attachmentId'));

            this.close();
        },
    });
});