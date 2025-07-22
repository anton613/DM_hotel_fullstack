# api/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.http import HttpResponse
from xhtml2pdf import pisa
from io import BytesIO
import matplotlib.pyplot as plt
import base64
from datetime import datetime

class GenerarReportePDF(APIView):
    def post(self, request):
        try:
            # Obtener datos del request
            filtros = request.data.get('filtros', {})
            datos_graficos = request.data.get('datos_graficos', {})
            
            # Generar gráficos como imágenes base64
            graficos_base64 = self.generar_graficos(datos_graficos)
            
            # Generar HTML del reporte
            html = self.generar_html_reporte(filtros, graficos_base64)
            
            # Crear PDF
            response = HttpResponse(content_type='application/pdf')
            response['Content-Disposition'] = f'attachment; filename="reporte_hoteles_{datetime.now().strftime("%Y%m%d_%H%M%S")}.pdf"'
            
            pisa_status = pisa.CreatePDF(html, dest=response)
            if pisa_status.err:
                return Response({'error': 'Error al generar PDF'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
            return response
            
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def generar_graficos(self, datos):
        graficos = {}
        
        # Gráfico 1: Reservas por estado
        fig, ax = plt.subplots(figsize=(8, 5))
        ax.bar(datos['estados']['labels'], datos['estados']['data'], 
               color=['#FFCE56', '#36A2EB', '#4BC0C0', '#FF6384'])
        ax.set_title('Reservas por Estado')
        ax.set_ylabel('Cantidad')
        graficos['estados'] = self.fig_to_base64(fig)
        
        # Gráfico 2: Ingresos por tipo de habitación
        fig, ax = plt.subplots(figsize=(8, 5))
        ax.pie(datos['tiposHabitacion']['data'], 
               labels=datos['tiposHabitacion']['labels'],
               autopct='%1.1f%%',
               colors=['#9966FF', '#FF9F40', '#36A2EB', '#FF6384', '#4BC0C0'])
        ax.set_title('Ingresos por Tipo de Habitación')
        graficos['tiposHabitacion'] = self.fig_to_base64(fig)
        
        # Gráfico 3: Ingresos mensuales
        fig, ax = plt.subplots(figsize=(8, 5))
        ax.plot(datos['ingresosMensuales']['labels'], 
                datos['ingresosMensuales']['data'],
                marker='o', color='#4BC0C0')
        ax.set_title('Ingresos Mensuales')
        ax.set_ylabel('Ingresos (S/.)')
        ax.grid(True, linestyle='--', alpha=0.3)
        graficos['ingresosMensuales'] = self.fig_to_base64(fig)
        
        # Gráfico 4: Ocupación por sede
        fig, ax = plt.subplots(figsize=(8, 5))
        ax.bar(datos['ocupacionSede']['labels'], 
               datos['ocupacionSede']['data'],
               color=['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0'])
        ax.set_title('Noches Reservadas por Sede')
        ax.set_ylabel('Noches')
        graficos['ocupacionSede'] = self.fig_to_base64(fig)
        
        return graficos
    
    def fig_to_base64(self, fig):
        buf = BytesIO()
        fig.savefig(buf, format='png', bbox_inches='tight', dpi=100)
        plt.close(fig)
        return base64.b64encode(buf.getvalue()).decode('utf-8')
    
    def generar_html_reporte(self, filtros, graficos):
        fecha_reporte = datetime.now().strftime("%d/%m/%Y %H:%M")
        
        return f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Reporte Estadístico Hotelero</title>
            <style>
                body {{
                    font-family: Arial, sans-serif;
                    margin: 0;
                    padding: 20px;
                    color: #333;
                }}
                .header {{
                    text-align: center;
                    margin-bottom: 30px;
                    border-bottom: 2px solid #3498db;
                    padding-bottom: 20px;
                }}
                .filtros {{
                    background-color: #f8f9fa;
                    padding: 15px;
                    margin-bottom: 20px;
                    border-radius: 5px;
                }}
                .grafico {{
                    margin: 30px 0;
                    text-align: center;
                }}
                .grafico img {{
                    max-width: 100%;
                    height: auto;
                }}
                .resumen {{
                    margin-top: 30px;
                    padding: 15px;
                    background-color: #f8f9fa;
                    border-radius: 5px;
                }}
                .resumen-item {{
                    display: inline-block;
                    margin: 0 20px;
                    text-align: center;
                }}
                .footer {{
                    margin-top: 30px;
                    text-align: center;
                    font-size: 12px;
                    color: #7f8c8d;
                }}
            </style>
        </head>
        <body>
            <div class="header">
                <h1>Reporte Estadístico Hotelero</h1>
                <p>Generado el: {fecha_reporte}</p>
            </div>
            
            <div class="filtros">
                <h3>Filtros aplicados:</h3>
                <p><strong>Sede:</strong> {filtros.get('sede', 'Todas')}</p>
                <p><strong>Tipo de habitación:</strong> {filtros.get('tipoHabitacion', 'Todos')}</p>
                <p><strong>Periodo:</strong> {filtros.get('tiempo', 'Últimos 3 meses')}</p>
            </div>
            
            <div class="grafico">
                <h2>Reservas por Estado</h2>
                <img src="data:image/png;base64,{graficos['estados']}">
            </div>
            
            <div class="grafico">
                <h2>Ingresos por Tipo de Habitación</h2>
                <img src="data:image/png;base64,{graficos['tiposHabitacion']}">
            </div>
            
            <div class="grafico">
                <h2>Ingresos Mensuales</h2>
                <img src="data:image/png;base64,{graficos['ingresosMensuales']}">
            </div>
            
            <div class="grafico">
                <h2>Ocupación por Sede</h2>
                <img src="data:image/png;base64,{graficos['ocupacionSede']}">
            </div>
            
            <div class="resumen">
                <h3>Resumen Estadístico</h3>
                <div class="resumen-item">
                    <h4>{filtros.get('totalReservas', 0)}</h4>
                    <p>Reservas totales</p>
                </div>
                <div class="resumen-item">
                    <h4>S/. {filtros.get('totalIngresos', '0.00')}</h4>
                    <p>Ingresos totales</p>
                </div>
                <div class="resumen-item">
                    <h4>S/. {filtros.get('promedioReserva', '0.00')}</h4>
                    <p>Promedio por reserva</p>
                </div>
                <div class="resumen-item">
                    <h4>{filtros.get('totalNoches', 0)}</h4>
                    <p>Noches reservadas</p>
                </div>
            </div>
            
            <div class="footer">
                Reporte generado automáticamente - Sistema de Gestión Hotelera
            </div>
        </body>
        </html>
        """